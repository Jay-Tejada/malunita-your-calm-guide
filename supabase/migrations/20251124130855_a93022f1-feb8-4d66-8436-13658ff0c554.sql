-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create focus_embeddings table
CREATE TABLE IF NOT EXISTS public.focus_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  task_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  cluster_label TEXT,
  unlocks_count INTEGER DEFAULT 0,
  task_id UUID,
  outcome TEXT,
  CONSTRAINT focus_embeddings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.focus_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own focus embeddings"
  ON public.focus_embeddings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus embeddings"
  ON public.focus_embeddings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all focus embeddings"
  ON public.focus_embeddings
  FOR ALL
  USING (is_service_role());

-- Create index for faster vector similarity searches
CREATE INDEX IF NOT EXISTS focus_embeddings_embedding_idx 
  ON public.focus_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS focus_embeddings_user_id_idx 
  ON public.focus_embeddings(user_id);

-- Create index for cluster queries
CREATE INDEX IF NOT EXISTS focus_embeddings_cluster_label_idx 
  ON public.focus_embeddings(cluster_label);