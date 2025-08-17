import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { initializeAgents, type Actors } from "../config/agent";
// @ts-ignore - AuthContext is a .jsx file, ignore TypeScript error
import { useAuth } from "./AuthContext";
import { useDAOManagement } from "./DAOManagementContext";

interface ActorContextType {
  actors: Actors | null;
  loading: boolean;
  error: string | null;
}

const ActorContext = createContext<ActorContextType | null>(null);

interface ActorProviderProps {
  children: ReactNode;
}

export const ActorProvider = ({ children }: ActorProviderProps) => {
  const [actors, setActors] = useState<Actors | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { identity } = useAuth();
  const { selectedDAO, daoActors, setActorsForDAO } = useDAOManagement();

  useEffect(() => {
    const setup = async () => {
      if (!selectedDAO) {
        setActors(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const existing = daoActors[selectedDAO.id];
        if (existing) {
          setActors(existing);
        } else {
          if (!selectedDAO.canisterIds?.daoBackend) {
            throw new Error("Selected DAO is missing canister IDs");
          }
          const initializedActors = await initializeAgents(
            selectedDAO.canisterIds,
            selectedDAO.id,
            identity
          );
          setActors(initializedActors);
          setActorsForDAO(selectedDAO.id, initializedActors);
        }
      } catch (err) {
        console.error("Failed to initialize actors:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    setup();
  }, [identity, selectedDAO, daoActors, setActorsForDAO]);

  return (
    <ActorContext.Provider value={{ actors, loading, error }}>
      {children}
    </ActorContext.Provider>
  );
};

export const useActors = () => {
  const context = useContext(ActorContext);
  // Don't throw error during loading phase, allow null context
  return context?.actors || null;
};

export const useActorState = () => {
  const context = useContext(ActorContext);
  return {
    actors: context?.actors || null,
    loading: context?.loading || false,
    error: context?.error || null
  };
};

