import { useState } from 'react';

function getOrCreateVoterId(): string {
  const key = 'neighborhood-truth-voter-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function useVoterId() {
  const [voterId] = useState(getOrCreateVoterId);
  return voterId;
}
