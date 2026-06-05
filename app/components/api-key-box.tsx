'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function ApiKeyBox({ apiKey }: { apiKey: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!apiKey) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(apiKey);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = apiKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('API Key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy API key');
    }
  };

  return (
    <div className="border-8 border-black bg-black p-5 shadow-neo-lg text-white h-full flex flex-col">
      <h2 className="text-2xl font-black text-neo-secondary uppercase tracking-tight">API Key</h2>
      <p className="mt-2 text-sm font-bold text-gray-400">Use this key to authenticate your CLI with <code className="text-neo-secondary">envarmor login</code></p>
      
      <div className="mt-6 flex items-stretch gap-2">
        <div className="flex-1 border-4 border-black bg-white p-4 font-mono text-sm font-bold text-black break-all min-h-[60px] flex items-center">
          {show ? apiKey : `${apiKey.substring(0, 8)}••••••••••••••••`}
        </div>
        <button
          onClick={() => setShow(!show)}
          className="border-4 border-black bg-neo-muted px-4 text-black shadow-neo-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
          title={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={3} />}
        </button>
      </div>

      <button
        onClick={handleCopy}
        className="mt-auto flex w-full items-center justify-center gap-2 border-4 border-black bg-neo-secondary px-4 py-3 text-sm font-black uppercase tracking-widest text-black shadow-neo-sm hover:-translate-y-1 transition-transform"
      >
        {copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={3} />}
        {copied ? 'Copied!' : 'Copy API Key'}
      </button>
    </div>
  );
}
