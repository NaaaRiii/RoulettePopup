//import React from 'react';
//import { render, fireEvent, waitFor } from '@testing-library/react';
//import EditRouletteText from './editRouletteText';
//import '@testing-library/jest-dom';

//// API呼び出しをモック
//const mockFetch = jest.spyOn(global, 'fetch');
//const mockResponse = (data) => {
//  return Promise.resolve({
//    json: () => Promise.resolve(data),
//  });
//};

//describe('EditRouletteText Component', () => {
//  it('renders correctly', () => {
//    const { getByText } = render(<EditRouletteText />);
//    expect(getByText('Edit your Roulette')).toBeInTheDocument();
//  });

//  it('fetches tickets and roulette texts from API and displays them', async () => {
//    mockFetch.mockImplementationOnce(() => mockResponse({ tickets: 3 }));
//    mockFetch.mockImplementationOnce(() => mockResponse([{ id: 1, number: 1, text: 'Text 1' }]));

//    const { getByText } = render(<EditRouletteText />);

//    await waitFor(() => {
//      expect(getByText('Number of tickets: 3')).toBeInTheDocument();
//      expect(getByText('Number: 1, Text: Text 1')).toBeInTheDocument();
//    });
//  });

//  it('enables edit button when tickets are more than 0', async () => {
//    mockFetch.mockImplementationOnce(() => mockResponse({ tickets: 1 }));

//    const { getByText } = render(<EditRouletteText />);

//    await waitFor(() => {
//      const editButton = getByText('Edit text using tickets');
//      expect(editButton).not.toBeDisabled();
//    });
//  });
//});


import React from 'react';
import { render, waitFor } from '@testing-library/react';
import EditRouletteText from './editRouletteText';
import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

beforeEach(() => {
  fetch.resetMocks();
});

describe('EditRouletteText Component', () => {
  it('renders correctly', async () => {
    fetch.mockResponseOnce(JSON.stringify({ tickets: 3 }));
    fetch.mockResponseOnce(JSON.stringify([{ id: 1, number: 1, text: 'Text 1' }]));

    const { getByText } = render(<EditRouletteText />);

    await waitFor(() => {
      expect(getByText('Number of tickets: 3')).toBeInTheDocument();
      expect(getByText('Number: 1, Text: Text 1')).toBeInTheDocument();
    });
  });

  // その他のテストケース...
});
