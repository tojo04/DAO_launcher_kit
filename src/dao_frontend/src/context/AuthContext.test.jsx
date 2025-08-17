import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ActorProvider } from './ActorContext';
import { DAOManagementProvider } from './DAOManagementContext';
import { initializeAgents } from '../config/agent';

// Mock AuthClient from DFINITY
const mockPrincipal = { toString: () => 'aaaa-bbbb' };
const mockIdentity = { getPrincipal: () => mockPrincipal };
const mockAuthClient = {
  login: ({ onSuccess }) => { onSuccess(); },
  isAuthenticated: () => Promise.resolve(false),
  getIdentity: () => mockIdentity,
  logout: vi.fn(),
};

vi.mock('@dfinity/auth-client', () => ({
  AuthClient: {
    create: vi.fn(() => Promise.resolve(mockAuthClient)),
  },
}));

vi.mock('../config/agent', () => ({
  initializeAgents: vi.fn(async () => ({})),
}));

const mockDAO = {
  id: 'dao1',
  name: 'Test DAO',
  description: 'desc',
  tokenSymbol: 'TST',
  memberCount: 0,
  totalValueLocked: '0',
  createdAt: new Date().toISOString(),
  category: 'Test',
  status: 'active',
  governance: { totalProposals: 0, activeProposals: 0 },
  treasury: { balance: '0', monthlyInflow: '0' },
  staking: { totalStaked: '0', apr: '0%' },
  canisterIds: { daoBackend: 'aaaaa-aa' }
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => [mockDAO] }));
  });

  it('updates identity and principal after login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current?.authClient).toBeDefined());

    await act(async () => {
      await result.current.login();
    });

    expect(result.current.identity).toBe(mockIdentity);
    expect(result.current.principal).toBe('aaaa-bbbb');
  });

  it('ActorProvider receives authenticated identity', async () => {
    const wrapper = ({ children }) => (
      <AuthProvider>
        <DAOManagementProvider>
          <ActorProvider>{null}</ActorProvider>
          {children}
        </DAOManagementProvider>
      </AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current?.authClient).toBeDefined());

    await act(async () => {
      await result.current.login();
    });

    await waitFor(() => {
      expect(initializeAgents).toHaveBeenCalledWith(mockDAO.canisterIds, mockIdentity);
    });
  });
});
