import { Service } from '@angular/core';
import { SimpleListService } from './simplelist.service';

export type { SimpleListItem as Brand } from './simplelist.service';

@Service()
export class BrandsService extends SimpleListService {
  protected readonly collectionName = 'marcas';
}