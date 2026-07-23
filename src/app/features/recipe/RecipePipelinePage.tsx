import { ArrowDown, ArrowUp, Clipboard, Download, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  parseRecipeDefinition,
  RECIPE_OPERATIONS,
  RECIPE_PRESETS,
  recipeOperationLabel,
  runRecipe,
  serializeRecipeDefinition,
  type RecipeDefinition,
  type RecipeOperation,
} from '../../../shared/analysis';
import { readLocalJson, writeLocalJson } from '../../utils/storage';

const SAVED_RECIPES_KEY = 'hexyr:saved-recipes:v1';
const MAX_SAVED_RECIPES = 20;

function initialSavedRecipes(): RecipeDefinition[] {
  const recipes = readLocalJson<unknown>(SAVED_RECIPES_KEY, []);
  if (!Array.isArray(recipes)) return [];
  return recipes.flatMap((recipe) => {
    try {
      return [parseRecipeDefinition(JSON.stringify(recipe))];
    } catch {
      return [];
    }
  });
}

export function RecipePipelinePage() {
  const [input, setInput] = useState('{"hello":"Hexyr","count":3}');
  const [name, setName] = useState('My local recipe');
  const [steps, setSteps] = useState<RecipeOperation[]>(['json-minify', 'base64url-encode']);
  const [nextOperation, setNextOperation] = useState<RecipeOperation>('base64-encode');
  const [savedRecipes, setSavedRecipes] = useState<RecipeDefinition[]>(initialSavedRecipes);
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState('');
  const result = useMemo(() => runRecipe(input, steps), [input, steps]);
  const definition = useMemo<RecipeDefinition>(
    () => ({ version: 1, name: name.trim() || 'Untitled recipe', steps }),
    [name, steps],
  );

  const updateSaved = (recipes: RecipeDefinition[]) => {
    setSavedRecipes(recipes);
    writeLocalJson(SAVED_RECIPES_KEY, recipes);
  };

  const loadRecipe = (recipe: RecipeDefinition) => {
    setName(recipe.name);
    setSteps([...recipe.steps]);
    setNotice(`Loaded “${recipe.name}”.`);
  };

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
    } catch {
      setNotice('Clipboard access is unavailable; select and copy the text manually.');
    }
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  };

  return (
    <section className="animate-rise space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Local Recipe Pipeline</h1>
          <p className="text-sm text-slate-400">
            Chain deterministic transforms, inspect every intermediate value, and reuse the recipe.
          </p>
        </div>
        <span className="text-xs text-slate-500">
          Recipe definitions may be saved locally; payloads are never saved.
        </span>
      </header>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <section className="glass rounded-md p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <input
                className="focus-ring min-w-48 flex-1 rounded border border-white/10 bg-surface-900/60 px-3 py-2 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 80))}
                aria-label="Recipe name"
              />
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-1.5 rounded border border-white/10 bg-surface-800 px-2.5 py-2 text-xs"
                onClick={() => {
                  const next = [
                    definition,
                    ...savedRecipes.filter((recipe) => recipe.name !== definition.name),
                  ].slice(0, MAX_SAVED_RECIPES);
                  updateSaved(next);
                  setNotice(`Saved “${definition.name}” in this browser.`);
                }}
              >
                <Save size={13} />
                Save recipe
              </button>
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-1.5 rounded border border-white/10 bg-surface-800 px-2.5 py-2 text-xs"
                onClick={() =>
                  void copy(serializeRecipeDefinition(definition), 'Recipe JSON copied.')
                }
              >
                <Download size={13} />
                Export JSON
              </button>
            </div>
            <textarea
              className="focus-ring h-40 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pipeline input"
              aria-label="Pipeline input"
              spellCheck={false}
            />
          </section>

          <section className="glass rounded-md p-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-xs uppercase tracking-[0.12em] text-slate-400">
                Transform steps
              </h2>
              <select
                className="control-select"
                value={nextOperation}
                onChange={(event) => setNextOperation(event.target.value as RecipeOperation)}
                aria-label="Operation to add"
              >
                {RECIPE_OPERATIONS.map((operation) => (
                  <option key={operation} value={operation}>
                    {recipeOperationLabel(operation)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-1 rounded border border-white/10 bg-surface-800 px-2.5 py-1.5 text-xs disabled:opacity-40"
                onClick={() => setSteps((current) => [...current, nextOperation])}
                disabled={steps.length >= 24}
              >
                <Plus size={13} />
                Add
              </button>
            </div>

            <ol className="mt-3 space-y-2">
              {steps.map((operation, index) => {
                const trace = result.trace[index];
                const failed = result.failedStep === index;
                return (
                  <li
                    key={`${operation}-${index}`}
                    className={`rounded border p-2 ${
                      failed
                        ? 'border-rose-400/40 bg-rose-500/10'
                        : 'border-white/10 bg-surface-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-surface-800 font-mono text-xs text-cyan-200">
                        {index + 1}
                      </span>
                      <select
                        className="control-select min-w-0 flex-1"
                        value={operation}
                        onChange={(event) =>
                          setSteps((current) =>
                            current.map((step, stepIndex) =>
                              stepIndex === index ? (event.target.value as RecipeOperation) : step,
                            ),
                          )
                        }
                        aria-label={`Transform step ${index + 1}`}
                      >
                        {RECIPE_OPERATIONS.map((candidate) => (
                          <option key={candidate} value={candidate}>
                            {recipeOperationLabel(candidate)}
                          </option>
                        ))}
                      </select>
                      {trace && (
                        <span className="hidden font-mono text-[10px] text-slate-500 sm:block">
                          {trace.inputLength.toLocaleString()} →{' '}
                          {trace.outputLength.toLocaleString()} chars
                        </span>
                      )}
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move step ${index + 1} up`}
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        aria-label={`Move step ${index + 1} down`}
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() =>
                          setSteps((current) =>
                            current.filter((_, stepIndex) => stepIndex !== index),
                          )
                        }
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {failed && <p className="mt-2 text-xs text-rose-300">{result.error}</p>}
                  </li>
                );
              })}
              {steps.length === 0 && (
                <li className="rounded border border-dashed border-white/10 py-6 text-center text-sm text-slate-500">
                  Add a transform to build a pipeline.
                </li>
              )}
            </ol>
          </section>

          <section className="glass rounded-md p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Final output</h2>
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-1.5 rounded border border-white/10 bg-surface-800 px-2 py-1 text-xs disabled:opacity-40"
                disabled={Boolean(result.error)}
                onClick={() => void copy(result.output, 'Pipeline output copied.')}
              >
                <Clipboard size={13} />
                Copy
              </button>
            </div>
            <textarea
              className="h-44 w-full resize-none rounded border border-white/10 bg-surface-900/40 p-3 font-mono text-sm text-cyan-100"
              value={result.output}
              readOnly
              aria-label="Pipeline output"
            />
          </section>

          {result.trace.length > 0 && (
            <details className="glass rounded-md p-3">
              <summary className="focus-ring cursor-pointer rounded text-xs uppercase tracking-[0.12em] text-slate-400">
                Intermediate values
              </summary>
              <div className="mt-3 space-y-2">
                {result.trace.map((trace) => (
                  <section key={trace.step} className="rounded border border-white/10 p-2">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>
                        {trace.step}. {recipeOperationLabel(trace.operation)}
                      </span>
                      <span className="font-mono">{trace.outputLength.toLocaleString()} chars</span>
                    </div>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-surface-950/50 p-2 font-mono text-xs text-slate-300">
                      {trace.output}
                    </pre>
                  </section>
                ))}
              </div>
            </details>
          )}
        </div>

        <aside className="space-y-3">
          <section className="glass rounded-md p-3">
            <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Presets</h2>
            <div className="mt-2 space-y-1">
              {RECIPE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className="focus-ring w-full rounded border border-white/10 bg-surface-900/30 px-2 py-2 text-left text-xs text-slate-200 hover:bg-white/5"
                  onClick={() => loadRecipe(preset)}
                >
                  <span className="block">{preset.name}</span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-500">
                    {preset.steps.join(' → ')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="glass rounded-md p-3">
            <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Saved here</h2>
            <div className="mt-2 space-y-1">
              {savedRecipes.map((recipe) => (
                <div key={recipe.name} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="focus-ring min-w-0 flex-1 rounded border border-white/10 bg-surface-900/30 px-2 py-2 text-left text-xs text-slate-200 hover:bg-white/5"
                    onClick={() => loadRecipe(recipe)}
                  >
                    <span className="block truncate">{recipe.name}</span>
                    <span className="block text-[10px] text-slate-500">
                      {recipe.steps.length} steps
                    </span>
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Delete saved recipe ${recipe.name}`}
                    onClick={() =>
                      updateSaved(
                        savedRecipes.filter((candidate) => candidate.name !== recipe.name),
                      )
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {savedRecipes.length === 0 && (
                <p className="py-3 text-xs text-slate-500">No recipes saved in this browser.</p>
              )}
            </div>
          </section>

          <section className="glass rounded-md p-3">
            <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Import recipe JSON
            </h2>
            <textarea
              className="focus-ring mt-2 h-28 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-2 font-mono text-xs"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder='{"version":1,"name":"...","steps":["trim"]}'
              aria-label="Recipe JSON to import"
            />
            <button
              type="button"
              className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded border border-white/10 bg-surface-800 px-2.5 py-1.5 text-xs"
              onClick={() => {
                try {
                  const recipe = parseRecipeDefinition(importText);
                  loadRecipe(recipe);
                  setImportText('');
                } catch (error) {
                  setNotice(error instanceof Error ? error.message : 'Recipe import failed.');
                }
              }}
            >
              <Upload size={13} />
              Import
            </button>
          </section>
        </aside>
      </div>

      {notice && (
        <div className="glass fixed bottom-16 right-4 z-30 max-w-sm rounded-md px-3 py-2 text-xs text-slate-200 shadow-glow">
          {notice}
          <button
            type="button"
            className="ml-3 text-slate-500 hover:text-slate-200"
            onClick={() => setNotice('')}
          >
            Dismiss
          </button>
        </div>
      )}
    </section>
  );
}
