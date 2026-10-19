/**
 * A value Jasmeet still has to supply.
 *
 * Fields that may be unknown are typed `T | Todo`, so every renderer has to handle the
 * missing case instead of printing a placeholder. The note must start with
 * `TODO(jasmeet):`, which keeps every open item findable with one grep.
 */
export type TodoNote = `TODO(jasmeet): ${string}`;

export interface Todo {
  readonly todo: TodoNote;
}

export const todo = (note: TodoNote): Todo => ({ todo: note });

export const isTodo = (value: unknown): value is Todo =>
  typeof value === "object" && value !== null && "todo" in value;
