const ADJECTIVES = [
  "Cosmic", "Sneaky", "Chill", "Wild", "Mighty", "Quirky", "Rowdy", "Curious",
  "Fearless", "Snappy", "Sunny", "Midnight", "Turbo", "Retro", "Lucky", "Cheeky",
  "Bold", "Electric", "Frosty", "Groovy",
];

const NOUNS = [
  "Pandas", "Wizards", "Ducks", "Rebels", "Nomads", "Legends", "Otters", "Foxes",
  "Raccoons", "Pixels", "Wanderers", "Rockets", "Ninjas", "Explorers", "Gremlins",
  "Falcons", "Yaks", "Llamas", "Corgis", "Sprites",
];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** A fun, memorable name for an auto-created match group — no relation to
 *  when/why it was formed, just something nicer than a timestamp. */
export function randomGroupName(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}
