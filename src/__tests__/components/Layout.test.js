import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../../components/Layout';
import '@testing-library/jest-dom';


jest.mock('next/head', () => {
  const HeadMock = ({ children }) => <>{children}</>;
  HeadMock.displayName = 'Head';
  return HeadMock;
});

jest.mock('../../components/Header', () => {
  const React = require('react');
  function HeaderMock() {
    return <div data-testid="header-mock" />;
  }
  return {
    __esModule: true,
    default: HeaderMock,
  };
});

jest.mock('../../components/Footer', () => {
  const React = require('react');
  function FooterMock() {
    return <div data-testid="footer-mock" />;
  }
  return {
    __esModule: true,
    default: FooterMock,
  };
});

describe('Layout コンポーネント', () => {
  let renderResult;

  beforeEach(() => {
    renderResult = render(
      <Layout>
        <div data-testid="child" />
      </Layout>
    );
  });

  it('head 内に <title>Plus ONE</title> がレンダリングされる', () => {
    const { container } = renderResult;
    const titleEl = container.querySelector('title');
    expect(titleEl).toBeInTheDocument();
    expect(titleEl).toHaveTextContent('Plus ONE');
  });

	it('meta[name="viewport"] が正しく挿入されている', () => {
    const { container } = renderResult;
    const viewportMeta = container.querySelector('meta[name="viewport"]');
    expect(viewportMeta).toBeInTheDocument();
    expect(viewportMeta).toHaveAttribute(
      'content',
      'width=device-width,initial-scale=1'
    );
  });

	it('meta[charset="utf-8"] が正しく挿入されている', () => {
    const { container } = renderResult;
    const charsetMeta = container.querySelector('meta[charset]');
    expect(charsetMeta).toBeInTheDocument();
    expect(charsetMeta).toHaveAttribute('charset', 'utf-8');
  });

  it('Header コンポーネントが必ず含まれている', () => {
    expect(screen.getByTestId('header-mock')).toBeInTheDocument();
  });

  it('Footer コンポーネントが必ず含まれている', () => {
    expect(screen.getByTestId('footer-mock')).toBeInTheDocument();
  });

  it('children が <div id="dashboard"> の中に描画され、正しい階層構造が維持されていること', () => {
    const childElement = screen.getByTestId('child');
    expect(childElement).toBeInTheDocument();
    expect(childElement.closest('#dashboard')).toBeInTheDocument();
  });
});