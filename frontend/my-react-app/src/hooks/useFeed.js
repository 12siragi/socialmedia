// hooks/useFeed.js
import { useState, useCallback, useRef } from "react";
import useUserActions from "./user.actions";

function useFeed() {
  const [posts, setPosts]           = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [hasMore, setHasMore]       = useState(true);
  const [error, setError]           = useState(null);
  
  const isFetching = useRef(false); // prevents double-fetch (StrictMode safe)

  const { getPosts } = useUserActions();

  const fetchPosts = useCallback(async (cursor = null) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await getPosts(cursor);
      
      setPosts(prev => 
        cursor 
          ? [...prev, ...data.results]  // append (load more)
          : data.results                // replace (first load / refresh)
      );
      
      setNextCursor(data.next);
      setHasMore(!!data.next);
      
    } catch (err) {
      setError("Failed to load posts. Please try again.");
      console.error("useFeed error:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [getPosts]);

  // Called when user scrolls to bottom
  const loadMore = useCallback(() => {
    if (hasMore && !isFetching.current && nextCursor) {
      fetchPosts(nextCursor);
    }
  }, [hasMore, nextCursor, fetchPosts]);

  // Pull to refresh / re-mount
  const refresh = useCallback(() => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
    fetchPosts(null);
  }, [fetchPosts]);

  // Called when user creates a new post — prepend to top
  const addPost = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Called when user deletes a post — remove from list
  const removePost = useCallback((postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // Called when user updates a post — update in place
  const updatePost = useCallback((updatedPost) => {
    setPosts(prev => prev.map(p => 
      p.id === updatedPost.id ? updatedPost : p
    ));
  }, []);

  return {
    posts,
    loading,
    hasMore,
    error,
    fetchPosts,
    loadMore,
    refresh,
    addPost,
    removePost,
    updatePost,
  };
}

export default useFeed;