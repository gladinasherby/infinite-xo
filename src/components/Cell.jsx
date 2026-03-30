export const Cell = ({ value, onClick, disabled }) => (
  <button className="cell" onClick={onClick} disabled={disabled}>
    <span>{value}</span>
  </button>
);
