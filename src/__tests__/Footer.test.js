import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../components/Footer';

describe('Footer コンポーネント', () => {
  it('フッターが正しく表示されること', () => {
    render(<Footer />);
    const footerElement = document.querySelector('footer');
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass('footer');
  });

  it('コピーライトテキストが正しく表示されること', () => {
    render(<Footer />);
    const copyrightText = screen.getByText('©︎ 2023 Plus ONE, Inc.');
    expect(copyrightText).toBeInTheDocument();
    expect(copyrightText.closest('.layout-footer_copyright')).toBeInTheDocument();
  });
});