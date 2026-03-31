import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: false,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  /** Número no formato internacional, sem símbolos (ex.: 5561999909464). */
  readonly whatsappNumber = '5561999909464';

  /** Mensagem já preenchida ao abrir o chat (o cliente pode editar antes de enviar). */
  readonly whatsappPrefillMessage =
    'Olá, venho através do site e tenho interesse em fazer uma cotação.';

  get whatsappHref(): string {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(this.whatsappPrefillMessage)}`;
  }
}
