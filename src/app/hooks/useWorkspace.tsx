import { createContext, useContext, useMemo, useState } from 'react';
import { readLocalSetting, writeLocalSetting } from '../utils/storage';

interface WorkspaceState {
  input: string;
  output: string;
  activeTool: string;
  setInput: (next: string) => void;
  setOutput: (next: string) => void;
  setActiveTool: (next: string) => void;
  clear: () => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTool, setActiveTool] = useState(
    readLocalSetting('hexyr:lastTool') ?? 'inspect',
  );

  const value = useMemo(
    () => ({
      input,
      output,
      activeTool,
      setInput,
      setOutput,
      setActiveTool: (next: string) => {
        setActiveTool(next);
        writeLocalSetting('hexyr:lastTool', next);
      },
      clear: () => {
        setInput('');
        setOutput('');
      },
    }),
    [activeTool, input, output],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceState {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return value;
}
