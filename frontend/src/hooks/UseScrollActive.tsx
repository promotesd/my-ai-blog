import { useState, useEffect, RefObject } from "react";

export default function useScrollActive(ref: RefObject<HTMLElement>) {
  const [state, setState] = useState(false);

  useEffect(() => {
    const scrollActive = () => {
      const scrollY = window.pageYOffset;

      const sectionHeight = ref.current?.offsetHeight;
      const sectionTop = ref.current?.offsetTop;

      // Pastikan sectionHeight dan sectionTop tidak undefined sebelum melanjutkan
      if (sectionHeight !== undefined && sectionTop !== undefined) {
        if (scrollY > sectionTop - 80 && scrollY <= sectionTop + sectionHeight) {
          setState(true);
        } else {
          setState(false);
        }
      }
    };

    scrollActive(); // Memanggil fungsi untuk menetapkan state awal
    window.addEventListener("scroll", scrollActive);

    return () => {
      window.removeEventListener("scroll", scrollActive);
    };
  }, [ref]);

  return state;
}
