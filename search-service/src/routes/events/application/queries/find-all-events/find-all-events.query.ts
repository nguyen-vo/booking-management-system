export class FindAllEventsQuery {
  constructor(
    public readonly name?: string,
    public readonly date?: string,
    public readonly location?: string,
    public readonly type?: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
