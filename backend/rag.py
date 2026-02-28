import os
from glob import glob
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

VECTOR_STORE_DIR = "./chroma_db"
vector_store = None
qa_chain = None

def initialize_vault(vault_path: str) -> bool:
    """
    Reads markdown files from the Obsidian vault, splits them into chunks, 
    embeds them using OpenAI, and stores them in a local ChromaDB.
    """
    global vector_store, qa_chain
    try:
        print(f"Loading documents from {vault_path}...")
        
        # Load all markdown files recursively from the vault
        loader = DirectoryLoader(vault_path, glob="**/*.md", loader_cls=TextLoader, use_multithreading=True)
        documents = loader.load()
        
        print(f"Loaded {len(documents)} documents. Splitting text...")
        
        # Split documents into smaller manageable chunks for embedding
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        chunks = text_splitter.split_documents(documents)
        print(f"Created {len(chunks)} text chunks.")

        # Initialize OpenAI embeddings using the API key loaded in environ
        embeddings = OpenAIEmbeddings()

        # Create or update the Chroma vector store
        print("Building vector database (this may take a moment and use OpenAI API)...")
        vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=VECTOR_STORE_DIR
        )
        
        # Initialize the Chat model and QA chain
        llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.2)
        
        # Custom prompt specifically for querying personal notes
        prompt_template = """You are a helpful and intelligent AI assistant that has access to the user's personal personal Obsidian knowledge vault.
Use the following pieces of context (extracted from their notes) to answer the user's question. 
If the answer cannot be found in the provided context, state that clearly, but you may draw upon your general knowledge to provide a helpful response if appropriate.
Always try to be supportive and engaging.

Context from Obsidian Notes:
{context}

User's Question: {question}

Helpful Answer:"""
        
        PROMPT = PromptTemplate(
            template=prompt_template, input_variables=["context", "question"]
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vector_store.as_retriever(search_kwargs={"k": 5}),
            return_source_documents=True,
            chain_type_kwargs={"prompt": PROMPT}
        )
        
        print("Vault initialization complete!")
        return True

    except Exception as e:
        print(f"Error during vault initialization: {e}")
        return False


def generate_answer(query: str) -> tuple[str, list[str]]:
    """
    Queries the initialized QA chain with the user's message.
    """
    global qa_chain
    if not qa_chain:
        raise ValueError("The vault has not been initialized yet. Please setup first.")
        
    result = qa_chain.invoke({"query": query})
    
    # Extract the main text response
    answer = result['result']
    
    # Extract source file names for transparency
    source_documents = result.get('source_documents', [])
    sources = list(set([doc.metadata.get('source', 'Unknown') for doc in source_documents]))
    
    return answer, sources
