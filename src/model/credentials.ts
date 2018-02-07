export class Credential {
  public email: string;
  public password: string;

  constructor(name: string, password: string) {
    this.email = name;
    this.password = password;
  }
}
