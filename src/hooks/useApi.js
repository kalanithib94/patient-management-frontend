import { useState, useEffect } from 'react';

// Custom hook for API calls with loading and error states
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiCall();
        
        if (isMounted) {
          setData(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

// Custom hook for paginated data
export const usePaginatedApi = (apiCall, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchData = async (newParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        ...params,
        ...newParams,
        page: newParams.page || pagination.page,
        limit: newParams.limit || pagination.limit
      };
      
      const response = await apiCall(queryParams);
      
      setData(response.data.data || response.data);
      setPagination(response.data.pagination || {
        page: queryParams.page,
        limit: queryParams.limit,
        total: response.data.total || 0,
        pages: Math.ceil((response.data.total || 0) / queryParams.limit)
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateParams = (newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
    fetchData(newParams);
  };

  const changePage = (page) => {
    fetchData({ page });
  };

  const changeLimit = (limit) => {
    fetchData({ limit, page: 1 });
  };

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    pagination,
    loading,
    error,
    updateParams,
    changePage,
    changeLimit,
    refetch
  };
};

// Custom hook for form submission
export const useFormSubmit = (apiCall) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const response = await apiCall(data);
      setSuccess(true);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return { submit, loading, error, success, reset };
};
