import { Service } from '@angular/core';
import { SimpleListService } from './simplelist.service';

export type { SimpleListItem as Category } from './simplelist.service';

@Service()
export class CategoriesService extends SimpleListService {
  protected readonly collectionName = 'categorias';
}