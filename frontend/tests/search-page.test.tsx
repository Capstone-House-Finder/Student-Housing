import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SearchContent } from '@/app/search/page';
import { listingsApi } from '@/lib/api';

const replaceMock = jest.fn();
const routerMock = {
  replace: replaceMock,
};
let searchParamString = '';

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(searchParamString),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('@/lib/api', () => ({
  listingsApi: {
    search: jest.fn(),
  },
  amenitiesApi: {
    list: jest.fn().mockResolvedValue({
      success: true,
      data: [{ name: 'WiFi' }],
    }),
  },
}));

describe('SearchContent', () => {
  beforeEach(() => {
    searchParamString = '';
    replaceMock.mockClear();
    jest.mocked(listingsApi.search).mockReset();
    jest.mocked(listingsApi.search).mockResolvedValue({
      success: true,
      data: {
        listings: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      },
    });
  });

  it('does not search while filters are being edited', async () => {
    render(<SearchContent />);

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Douala' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min'), {
      target: { value: '100000' },
    });
    fireEvent.change(screen.getByLabelText('Property Type'), {
      target: { value: 'apartment' },
    });

    await waitFor(() => {
      expect(listingsApi.search).not.toHaveBeenCalled();
    });
    expect(screen.getByText('Ready to Search')).toBeInTheDocument();
  });

  it('searches only after the form is submitted', async () => {
    render(<SearchContent />);

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Buea' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(listingsApi.search).toHaveBeenCalledTimes(1);
    });
    expect(listingsApi.search).toHaveBeenCalledWith('test-token', {
      page: 1,
      limit: 12,
      location: 'Buea',
      sortBy: 'date',
    });
  });

  it('does not re-search old criteria when editing after a paged search', async () => {
    searchParamString = 'location=Buea&page=2';

    render(<SearchContent />);

    await waitFor(() => {
      expect(listingsApi.search).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Douala' },
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Douala')).toBeInTheDocument();
    });
    expect(listingsApi.search).toHaveBeenCalledTimes(1);
  });
});
