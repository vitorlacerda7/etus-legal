interface Props {
  status: string
  label: string
}

export default function StatusBadge({ status, label }: Props) {
  return <span className={`badge badge-${status}`}>{label}</span>
}
