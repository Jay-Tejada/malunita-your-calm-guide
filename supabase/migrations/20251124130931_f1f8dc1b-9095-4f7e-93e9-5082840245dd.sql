-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION public.match_focus_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_user_id uuid
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  created_at timestamptz,
  task_text text,
  cluster_label text,
  unlocks_count int,
  task_id uuid,
  outcome text,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id,
    fe.user_id,
    fe.created_at,
    fe.task_text,
    fe.cluster_label,
    fe.unlocks_count,
    fe.task_id,
    fe.outcome,
    1 - (fe.embedding <=> query_embedding) as similarity
  FROM public.focus_embeddings fe
  WHERE 
    fe.user_id = target_user_id
    AND 1 - (fe.embedding <=> query_embedding) > match_threshold
  ORDER BY fe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;