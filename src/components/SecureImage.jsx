import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

/**
 * SecureImage Component
 * Loads protected image URLs (like /api/files/{id}/download) by fetching them
 * via axiosInstance with the Authorization Bearer header, converting to a Blob URL.
 */
const SecureImage = ({
  src,
  alt = "",
  className = "",
  fallback = null,
  style = {},
  ...props
}) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setBlobUrl(null);
      setLoading(false);
      setHasError(false);
      return;
    }

    // Direct render for data URLs or local object blob URLs
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      setBlobUrl(src);
      setLoading(false);
      setHasError(false);
      return;
    }

    let isMounted = true;
    let createdUrl = null;

    setLoading(true);
    setHasError(false);

    // Clean relative path if needed
    let cleanSrc = src;
    if (cleanSrc.startsWith("/")) {
      cleanSrc = cleanSrc.replace(/^\/api\//, "/");
    }

    axiosInstance
      .get(cleanSrc, {
        responseType: "blob",
      })
      .then((response) => {
        if (!isMounted) return;
        createdUrl = URL.createObjectURL(response.data);
        setBlobUrl(createdUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load authenticated image via blob:", src, err);
        if (!isMounted) return;
        // Fallback to direct src if blob request fails
        setBlobUrl(src);
        setHasError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [src]);

  if (!src || (hasError && fallback)) {
    return fallback || null;
  }

  if (loading && fallback) {
    return fallback;
  }

  return (
    <img
      src={blobUrl || src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export default SecureImage;

