import os
from langchain_groq import ChatGroq
from rag_engine.core.engine import RAGCoreEngine
from dotenv import load_dotenv

load_dotenv()

# The Singleton Instance
_engine_instance = None

# --- THE NEXUS PERSONA (ChatGPT/SaaS Style) ---
# This ensures Mermaid never crashes and the output looks professional
# backend/app/services/rag_services.py

NEXUS_STRUCTURED_PERSONA = """
You are the "Nexus Intelligence Engine," a high-end RAG system. 
Your goal is to provide precise, document-based answers with professional formatting.

### OPERATIONAL GUIDELINES:
1. SOURCE FIDELITY: Only answer based on the provided context. If the answer isn't there, say you don't know.
2. TONE: Objective, technical, and concise.
3. FORMATTING:
   - Use bold headers (###) for sections.
   - Use bullet points for lists.
   - Use Markdown Tables ONLY for data comparisons or specifications.
   - MERMAID DIAGRAMS: Use ONLY when explaining a multi-step process, system architecture, or complex logic. Do NOT provide a diagram for simple text explanations.
4. MERMAID SYNTAX:
   - ALWAYS use double quotes for labels: A["Process Name"].
   - Use 'graph TD' for vertical or 'graph LR' for horizontal flow.
"""

def get_nexus_engine(persona: str = None):
    global _engine_instance
    
    if _engine_instance is None:
        print("🛠️ INITIALIZING RAG ENGINE (SINGLETON)...")
        
        # Gather Config
        config = {
            "DATABASE_URL": os.getenv("DATABASE_URL"),
            "PINECONE_API_KEY": os.getenv("PINECONE_API_KEY"),
            "PINECONE_INDEX_NAME": os.getenv("PINECONE_INDEX_NAME"),
            "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
            "VISION_MODEL": os.getenv("VISION_MODEL", "openai-gpt-4o-mini"),
            "LLAMA_CLOUD_API_KEY": os.getenv("LLAMA_CLOUD_API_KEY")
        }
        
        # Higher temperature (0.1) for slightly better reasoning while keeping it factual
        llm = ChatGroq(
            model="llama-3.3-70b-versatile", 
            api_key=config["GROQ_API_KEY"],
            temperature=0.1 
        )
        
        # Use our strict persona if none is provided
        active_persona = persona if persona else NEXUS_STRUCTURED_PERSONA
        
        _engine_instance = RAGCoreEngine(
            config, 
            planner_llm=llm, 
            brain_llm=llm, 
            system_persona=active_persona
        )
        
    return _engine_instance