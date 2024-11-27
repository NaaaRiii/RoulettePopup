import * as React from 'react';

// eslint-disable-next-line react/display-name
const NextImageMock = ({ src, alt, width, height, ...props }) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} {...props} />
  );
};

export default NextImageMock;