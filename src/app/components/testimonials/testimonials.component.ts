import { Component, OnInit } from '@angular/core';
import { TestimonialsDataService, Testimonial } from '../../services/testimonials-data.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-testimonials',
  standalone: false,
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss'
})
export class TestimonialsComponent implements OnInit {
  readonly feedbackFormUrl = 'https://forms.gle/uNyhxwDxe83zBTMR6';
  readonly testimonialsCsvUrl = environment.testimonialsCsvUrl;
  readonly fallbackMessage =
    'Os depoimentos reais aparecerao aqui assim que a planilha publica estiver configurada.';
  loading = true;
  loadError = false;

  testimonials: Testimonial[] = [];

  private readonly fallbackTestimonials: Testimonial[] = [
    {
      author: 'Juliana Almeida',
      role: 'Cliente Familhas',
      text:
        'Achei que viajar seria muito caro para minha familia, mas a Familhas montou um roteiro que coube no nosso bolso.'
    },
    {
      author: 'Carlos Menezes',
      role: 'Cliente Familhas',
      text:
        'Atendimento muito humano e claro em cada etapa. Tivemos seguranca para fechar a viagem e deu tudo certo.'
    },
    {
      author: 'Renata Souza',
      role: 'Cliente Familhas',
      text:
        'Foi a nossa primeira viagem em familia e foi inesquecivel. O suporte antes e durante a viagem fez toda diferenca.'
    },
    {
      author: 'Leandro e Paula',
      role: 'Clientes Familhas',
      text:
        'Conseguimos conhecer o Nordeste com planejamento e economia. A agencia cuidou dos detalhes e evitou dor de cabeca.'
    },
    {
      author: 'Fernanda Rocha',
      role: 'Cliente Familhas',
      text:
        'Gostei da transparencia e da atencao da equipe. Sentimos confianca do inicio ao fim da nossa experiencia.'
    },
    {
      author: 'Marcio Silva',
      role: 'Cliente Familhas',
      text:
        'Mesmo com orcamento limitado, conseguimos viajar bem. A orientacao da Familhas foi essencial para realizar esse sonho.'
    }
  ];

  constructor(private readonly testimonialsDataService: TestimonialsDataService) {}

  ngOnInit(): void {
    this.testimonialsDataService.loadFromCsv(this.testimonialsCsvUrl).subscribe({
      next: (items) => {
        this.testimonials = items.length > 0 ? items : this.fallbackTestimonials;
        this.loading = false;
      },
      error: () => {
        this.testimonials = this.fallbackTestimonials;
        this.loadError = true;
        this.loading = false;
      }
    });
  }
}
