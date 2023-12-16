import React, { useState, useEffect } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      timeoutId = setTimeout(() => {
        setShouldRender(true);
      }, 800); // 遅延表示
    } else {
      setShouldRender(false);
    }

    return () => clearTimeout(timeoutId); // クリーンアップ関数
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
        {/*<button onClick={onClose}>Close</button>*/}
      </div>
    </div>
  );
};

export default Modal;
