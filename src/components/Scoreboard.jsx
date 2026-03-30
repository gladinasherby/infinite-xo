export const Scoreboard = ({ scores }) => (
  <div className="scoreboard">
    <div className="score-item">X: {scores.X}</div>
    <div className="score-divider">|</div>
    <div className="score-item">O: {scores.O}</div>
  </div>
);
