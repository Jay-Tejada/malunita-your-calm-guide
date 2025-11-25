interface OneThingPromptProps {
  questionText: string;
  onClick?: () => void;
  subtle?: boolean;
}

export const OneThingPrompt = ({ questionText, onClick, subtle }: OneThingPromptProps) => {
  return (
    <div
      onClick={onClick}
      className={`
        w-full text-center px-4 py-2
        font-mono text-sm
        transition-opacity duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${subtle ? 'opacity-60' : 'opacity-90'}
      `}
      style={{
        color: '#6F6F6F',
      }}
    >
      {questionText}
    </div>
  );
};
