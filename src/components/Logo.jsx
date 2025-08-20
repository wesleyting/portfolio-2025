import { forwardRef } from "react";

const Logo = forwardRef((props, ref) => {
  return (
    <svg ref={ref} width="160" height="160" viewBox="-4 -4 133 136" fill="red">
      <path
d="M25.0553 28H1V52.0553H25.0553V28Z"
        fill="none"
        stroke="red"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
d="M125 28L111.1 52.0553L84.7756 97.6546H57.0195L83.3438 52.0553L97.2218 28H125Z"
        fill="none"
        stroke="#e3e4d8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
d="M79.9727 28L66.0947 52.0553L39.7704 97.6546H1V73.5993H25.8703L38.3165 52.0553L52.1946 28H79.9727Z"
        fill="none"
        stroke="#e3e4d8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export default Logo;
