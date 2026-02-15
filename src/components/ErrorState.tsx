interface ErrorStateProps {
  message: string
}

export function ErrorState({ message }: ErrorStateProps) {
  return <p className="state-text error-text">{message}</p>
}
