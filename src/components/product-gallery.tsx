"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImage } from "@/lib/supabase/products";

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex];

  if (!images.length) {
    return <div className="detail-image"><span className="product-image-placeholder">Image arriving soon</span></div>;
  }

  function changeImage(nextIndex: number) {
    setSelectedIndex((nextIndex + images.length) % images.length);
  }

  return (
    <div className="product-gallery">
      <div className="detail-image group">
        <img src={selectedImage.image_url} alt={selectedImage.alt_text || `${productName} product image ${selectedIndex + 1}`} />
        {images.length > 1 ? (
          <>
            <button type="button" className="gallery-control gallery-control-prev" aria-label="Previous product image" onClick={() => changeImage(selectedIndex - 1)}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="gallery-control gallery-control-next" aria-label="Next product image" onClick={() => changeImage(selectedIndex + 1)}>
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="gallery-thumbnails" aria-label="Product images">
          {images.map((image, index) => (
            <button type="button" key={image.id || image.image_url} className={`gallery-thumbnail ${index === selectedIndex ? "is-selected" : ""}`} aria-label={`View product image ${index + 1}`} aria-pressed={index === selectedIndex} onClick={() => setSelectedIndex(index)}>
              <img src={image.image_url} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
