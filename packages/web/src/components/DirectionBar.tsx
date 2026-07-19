import { useGame } from '../context/GameContext';

const dirLabels: Record<string, string> = { north: '↑北', south: '↓南', east: '→东', west: '←西', up: '△上', down: '▽下' };

export function DirectionBar() {
  const { room, move } = useGame();
  const exits = room?.exits ?? {};

  return (
    <nav className="direction-bar" data-testid="exits">
      {Object.keys(exits).length === 0 ? (
        <span className="direction-empty">此处暂无可通行的出口。</span>
      ) : (
        ['north', 'south', 'west', 'east', 'up', 'down'].filter((d) => exits[d]).map((d) => (
          <button key={d} type="button" className="exit-button" data-testid={`exit-${d}`} onClick={() => move(d)}>
            {dirLabels[d] ?? d}
          </button>
        ))
      )}
    </nav>
  );
}
