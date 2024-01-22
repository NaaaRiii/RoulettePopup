import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
//import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';
import RoulettePopup from './RoulettePopup';
import { fetchRouletteText } from './utils';

// fetchRouletteText 関数のモック
jest.mock('./utils', () => ({
  fetchRouletteText: jest.fn()
}));

describe('RoulettePopup Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(<RoulettePopup />);
    expect(getByText('Start')).toBeInTheDocument();
  });

  it('should start spinning when button is clicked', () => {
    const { getByText } = render(<RoulettePopup />);
    const startButton = getByText('Start');
    fireEvent.click(startButton);
    expect(startButton).toBeDisabled();
  });

  it('should show modal with roulette text after spinning', async () => {
    fetchRouletteText.mockResolvedValue({ text: 'Test text' });

    const { getByText, queryByText } = render(<RoulettePopup />);
    const startButton = getByText('Start');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(queryByText('Matched text is: Test text')).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 10000);
});
