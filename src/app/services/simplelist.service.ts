import { collection, addDoc, getDocs, CollectionReference } from 'firebase/firestore';
import { from, Observable, switchMap, map } from 'rxjs';
import { db } from '../firebase.config';

export interface SimpleListItem {
  id: string;
  nome: string;
}

/**
 * Base pra qualquer lista simples do tipo "nome cadastrado, sem duplicar
 * ignorando maiúsculas/minúsculas" — hoje usada por Marcas e Categorias.
 * Cada subclasse só diz qual coleção do Firestore usar.
 */
export abstract class SimpleListService {
  protected abstract readonly collectionName: string;

  private get itemsCollection(): CollectionReference {
    return collection(db, this.collectionName);
  }

  list(): Observable<SimpleListItem[]> {
    const promise = getDocs(this.itemsCollection).then((snapshot) =>
      snapshot.docs.map((doc) => ({ id: doc.id, nome: (doc.data() as { nome: string }).nome }))
    );
    return from(promise).pipe(map((items) => items.sort((a, b) => a.nome.localeCompare(b.nome))));
  }

  /**
   * "Lupo" e "lupo" (ou "Meia" e "meia") não podem virar dois itens diferentes
   * — por isso a checagem ignora maiúsculas/minúsculas e espaços nas pontas.
   */
  add(nome: string): Observable<'created' | 'duplicate'> {
    const normalized = nome.trim();

    return this.list().pipe(
      switchMap((items) => {
        const isDuplicate = items.some((item) => item.nome.toLowerCase() === normalized.toLowerCase());
        if (isDuplicate) {
          return from(Promise.resolve('duplicate' as const));
        }
        return from(addDoc(this.itemsCollection, { nome: normalized }).then(() => 'created' as const));
      })
    );
  }
}