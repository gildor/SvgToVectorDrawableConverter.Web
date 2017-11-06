export class SendingEvent {
  constructor(readonly xhr: XMLHttpRequest, readonly formData: FormData) { }
}
