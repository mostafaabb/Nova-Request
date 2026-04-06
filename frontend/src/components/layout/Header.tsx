'use client';

import { useTheme } from '@/components/ThemeProvider';
import { useEnvironmentStore } from '@/store/environmentStore';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  Moon,
  Sun,
  History,
  Settings,
  Globe,
  Plus,
  Trash2,
  X,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    addEnvironment,
    deleteEnvironment,
    updateVariable,
    addVariable,
    removeVariable
  } = useEnvironmentStore();

  const [showEnvModal, setShowEnvModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  const activeEnv = environments.find(e => e.id === activeEnvironmentId) || environments.find(e => e.id === 'globals');

  return (
    <header className="h-14 border-b border-border flex items-center px-6 justify-between bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 font-extrabold text-xl tracking-tighter hover:text-primary transition-colors group">
          <div className="p-1 bg-primary rounded-lg group-hover:rotate-12 transition-transform">
            <Zap className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
          </div>
          Nova Request
        </Link>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={activeEnvironmentId || 'globals'}
            onChange={(e) => setActiveEnvironment(e.target.value === 'globals' ? null : e.target.value)}
            className="w-40 h-8 text-[11px] font-bold bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20 cursor-pointer"
          >
            <option value="globals">No Environment</option>
            {environments.filter(e => e.id !== 'globals').map((env) => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => setShowEnvModal(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/dashboard/history">
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 transition-all active:scale-90" title="History">
            <History className="h-5 w-5" />
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-primary/10 transition-all active:scale-90"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Environment Manager Modal */}
      <Modal
        isOpen={showEnvModal}
        onClose={() => setShowEnvModal(false)}
        title="Environment Manager"
        className="max-w-4xl"
      >
        <div className="flex h-[500px] gap-6 mt-4">
          {/* Sidebar */}
          <div className="w-48 flex flex-col gap-2 border-r border-border pr-6">
             <div className="space-y-1">
               {environments.map(env => (
                 <button
                   key={env.id}
                   onClick={() => setActiveEnvironment(env.id === 'globals' ? null : env.id)}
                   className={cn(
                     "w-full text-left px-3 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-tight transition-all",
                     (env.id === activeEnvironmentId || (env.id === 'globals' && !activeEnvironmentId)) 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                   )}
                 >
                   {env.name}
                 </button>
               ))}
             </div>
             <div className="mt-auto pt-4 border-t border-border">
                <div className="flex gap-1">
                  <Input 
                    placeholder="Env Name..." 
                    className="h-8 text-[10px]" 
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newEnvName.trim()) {
                        addEnvironment(newEnvName);
                        setNewEnvName('');
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    className="h-8 w-8 min-w-[32px]" 
                    onClick={() => {
                      if (newEnvName.trim()) {
                        addEnvironment(newEnvName);
                        setNewEnvName('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <div>
                   <h3 className="font-extrabold text-xl tracking-tight">{activeEnv?.name}</h3>
                   <p className="text-xs text-muted-foreground">Manage variables for this environment context.</p>
                </div>
                {activeEnv?.id !== 'globals' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10" 
                    onClick={() => deleteEnvironment(activeEnv!.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
             </div>

             <div className="flex-1 overflow-auto bg-muted/20 rounded-2xl border border-border p-6">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 text-[10px] uppercase font-black text-muted-foreground/60 mb-4 px-2 tracking-widest">
                   <div>Variable Name</div>
                   <div>Initial Value</div>
                   <div className="w-9"></div>
                </div>
                <div className="space-y-2">
                  {activeEnv?.variables.map((v, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center group animate-in fade-in slide-in-from-top-1">
                      <Input 
                        placeholder="e.g. host" 
                        value={v.key} 
                        onChange={(e) => updateVariable(activeEnv.id, i, { ...v, key: e.target.value })}
                        className="h-10 text-xs font-mono font-bold bg-background focus:ring-primary/20"
                      />
                      <Input 
                        placeholder="Value" 
                        value={v.value} 
                        onChange={(e) => updateVariable(activeEnv.id, i, { ...v, value: e.target.value })}
                        className="h-10 text-xs font-mono bg-background focus:ring-primary/20"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg" 
                        onClick={() => removeVariable(activeEnv.id, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full h-10 border-2 border-dashed border-border hover:bg-primary/5 hover:border-primary/20 text-xs font-extrabold uppercase tracking-wide mt-4 rounded-xl transition-all" 
                    onClick={() => addVariable(activeEnv!.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Variable
                  </Button>
                </div>
             </div>
          </div>
        </div>
      </Modal>
    </header>
  );
}