import { render, screen } from '@testing-library/react';
import App from './App';

test('renders sakura title', () => {
  render(<App />);
  const titleElement = screen.getByText(/sakura\.xyz/i);
  expect(titleElement).toBeInTheDocument();
});
