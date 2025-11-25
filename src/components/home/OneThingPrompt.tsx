interface OneThingPromptProps {
  questionText: string;
  onClick?: () => void;
  subtle?: boolean;
}

export const OneThingPrompt = ({ questionText, onClick, subtle = true }: OneThingPromptProps) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        onClick={onClick}
        className={`
          w-[90%] md:w-full max-w-2xl mx-auto text-center px-4 py-2
          font-mono text-sm md:text-base
          transition-opacity duration-200
          ${onClick ? 'cursor-pointer hover:opacity-100' : ''}
          ${subtle ? 'opacity-60' : 'opacity-90'}
        `}
        style={{
          color: '#6F6F6F',
        }}
      >
        {questionText}
      </div>
      
      {!subtle && (
        <div 
          className="text-center font-mono"
          style={{
            fontSize: '11px',
            opacity: 0.6,
            color: '#6F6F6F',
          }}
        >
          AI Intelligence
        </div>
      )}
    </div>
  );
};
