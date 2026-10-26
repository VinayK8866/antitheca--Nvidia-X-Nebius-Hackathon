import re
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
import networkx as nx

from app.database import get_self_db_connection
from app.embeddings import generate_embedding, float_list_to_blob, blob_to_float_list, cosine_similarity

logger = logging.getLogger(__name__)

# Color mapping for 3D force graph visualization
NODE_COLORS = {
    "concept": "#6366f1",    # Indigo
    "document": "#3b82f6",   # Blue
    "decision": "#10b981",   # Emerald Green
    "memory": "#f59e0b",     # Amber
    "paradox": "#ef4444",    # Crimson Red (Adversarial Contradiction)
    "tag": "#8b5cf6",        # Purple
    "external": "#06b6d4"    # Cyan (Tavily verified)
}

def extract_wikilinks(text: str) -> List[str]:
    """Finds all [[wikilink]] targets in markdown content."""
    matches = re.findall(r'\[\[(.*?)\]\]', text)
    cleaned = []
    for m in matches:
        # Handle [[link|display]] syntax
        target = m.split('|')[0].strip()
        if target and target not in cleaned:
            cleaned.append(target)
    return cleaned

def extract_hashtags(text: str) -> List[str]:
    """Finds all #tags in text, ignoring hex colors and code blocks."""
    # Simple regex for hashtags
    matches = re.findall(r'(?<!\S)#([A-Za-z0-9_-]+)', text)
    return list(set(m.lower() for m in matches if not m.isdigit()))

class KnowledgeGraphEngine:
    """Graph engine managing epistemic topology and 3D visual export."""

    def __init__(self):
        self.graph = nx.DiGraph()

    def get_or_create_node(self, conn, node_key: str, name: str, node_type: str = "concept", description: str = "") -> int:
        """Finds or inserts a graph node in self_brain.db."""
        cur = conn.cursor()
        cur.execute("SELECT id FROM graph_nodes WHERE node_key = ?", (node_key,))
        row = cur.fetchone()
        if row:
            return row["id"]

        cur.execute("""
        INSERT INTO graph_nodes (node_key, name, node_type, description, metadata_json)
        VALUES (?, ?, ?, ?, ?)
        """, (node_key, name, node_type, description, json.dumps({"color": NODE_COLORS.get(node_type, "#94a3b8")})))
        node_id = cur.lastrowid
        conn.commit()
        return node_id

    def add_edge(self, conn, source_id: int, target_id: int, relation_type: str = "wikilink", weight: float = 1.0, metadata: Optional[Dict] = None):
        """Creates or updates a directed edge between nodes."""
        if source_id == target_id:
            return
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO graph_edges (source_id, target_id, relation_type, weight, metadata_json)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(source_id, target_id, relation_type) 
        DO UPDATE SET weight = excluded.weight, metadata_json = excluded.metadata_json
        """, (source_id, target_id, relation_type, weight, json.dumps(metadata or {})))
        conn.commit()

    def sync_document_to_graph(self, doc_id: int, title: str, content: str, modality: str = "note"):
        """Extracts wikilinks, tags, and semantic edges for a document."""
        conn = get_self_db_connection()
        try:
            doc_key = f"doc_{doc_id}"
            doc_node_id = self.get_or_create_node(conn, doc_key, title, node_type="document", description=f"Modality: {modality}")

            # 1. Process Wikilinks
            wikilinks = extract_wikilinks(content)
            for target_title in wikilinks:
                concept_key = f"concept_{target_title.lower().replace(' ', '_')}"
                concept_id = self.get_or_create_node(conn, concept_key, target_title, node_type="concept")
                self.add_edge(conn, doc_node_id, concept_id, relation_type="wikilink", weight=1.0)

            # 2. Process Hashtags
            tags = extract_hashtags(content)
            for tag in tags:
                tag_key = f"tag_{tag}"
                tag_id = self.get_or_create_node(conn, tag_key, f"#{tag}", node_type="tag")
                self.add_edge(conn, doc_node_id, tag_id, relation_type="tagged", weight=0.8)

            # 3. Discover Semantic Similarity Edges
            self._connect_semantic_neighbors(conn, doc_id, doc_node_id)

        finally:
            conn.close()

    def _connect_semantic_neighbors(self, conn, current_doc_id: int, current_node_id: int, top_k: int = 3, threshold: float = 0.65):
        """Finds conceptually similar documents via cosine similarity on chunk embeddings."""
        cur = conn.cursor()
        cur.execute("SELECT embedding_blob FROM chunks WHERE doc_id = ? AND chunk_index = 0", (current_doc_id,))
        first_chunk = cur.fetchone()
        if not first_chunk or not first_chunk["embedding_blob"]:
            return

        current_vec = blob_to_float_list(first_chunk["embedding_blob"])
        
        # Compare against other documents' first chunks
        cur.execute("""
        SELECT c.doc_id, c.embedding_blob, gn.id as other_node_id 
        FROM chunks c
        JOIN graph_nodes gn ON gn.node_key = 'doc_' || c.doc_id
        WHERE c.doc_id != ? AND c.chunk_index = 0
        """, (current_doc_id,))
        candidates = cur.fetchall()

        scores = []
        for cand in candidates:
            other_blob = cand["embedding_blob"]
            if other_blob:
                other_vec = blob_to_float_list(other_blob)
                sim = cosine_similarity(current_vec, other_vec)
                if sim >= threshold:
                    scores.append((cand["other_node_id"], sim))

        scores.sort(key=lambda x: x[1], reverse=True)
        for target_node_id, sim in scores[:top_k]:
            self.add_edge(conn, current_node_id, target_node_id, relation_type="similarity", weight=float(sim))

    def export_3d_graph_json(self) -> Dict[str, Any]:
        """Exports graph in 3D force-directed format for Next.js / Three.js frontend."""
        conn = get_self_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id, node_key, name, node_type, description, metadata_json FROM graph_nodes")
        nodes_raw = cur.fetchall()

        cur.execute("SELECT source_id, target_id, relation_type, weight, metadata_json FROM graph_edges")
        edges_raw = cur.fetchall()
        conn.close()

        nodes = []
        for n in nodes_raw:
            meta = json.loads(n["metadata_json"] or "{}")
            node_type = n["node_type"]
            nodes.append({
                "id": str(n["id"]),
                "name": n["name"],
                "node_key": n["node_key"],
                "type": node_type,
                "description": n["description"] or "",
                "color": meta.get("color", NODE_COLORS.get(node_type, "#94a3b8")),
                "val": 4 if node_type in ["document", "decision"] else (6 if node_type == "paradox" else 2)
            })

        links = []
        for e in edges_raw:
            links.append({
                "source": str(e["source_id"]),
                "target": str(e["target_id"]),
                "relation": e["relation_type"],
                "value": float(e["weight"] or 1.0)
            })

        return {"nodes": nodes, "links": links}

    def detect_graph_anomalies_and_bridges(self) -> Dict[str, Any]:
        """Identifies bridge nodes (interdisciplinary breakthroughs) and isolated concepts."""
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, node_type FROM graph_nodes")
        nodes = cur.fetchall()
        cur.execute("SELECT source_id, target_id, relation_type FROM graph_edges")
        edges = cur.fetchall()
        conn.close()

        G = nx.Graph()
        for n in nodes:
            G.add_node(n["id"], name=n["name"], type=n["node_type"])
        for e in edges:
            G.add_edge(e["source_id"], e["target_id"], relation=e["relation_type"])

        bridges = []
        if len(G) > 2:
            try:
                betweenness = nx.betweenness_centrality(G)
                sorted_betweenness = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)
                for node_id, score in sorted_betweenness[:5]:
                    if score > 0.05:
                        bridges.append({
                            "id": node_id,
                            "name": G.nodes[node_id].get("name"),
                            "centrality": round(score, 3)
                        })
            except Exception as e:
                logger.debug(f"Betweenness centrality calculation error: {e}")

        return {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "bridge_concepts": bridges,
            "connected_components": nx.number_connected_components(G) if len(G) > 0 else 0
        }

graph_engine = KnowledgeGraphEngine()
