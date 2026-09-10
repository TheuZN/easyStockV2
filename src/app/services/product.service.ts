import { Service } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { from, Observable, map } from 'rxjs';
import { db } from '../firebase.config';

export interface ProductVariation {
  SKUFilho: string;
  tamanhoVariacao: string;
  corVariacao: string;
  estoqueVariacao: number;
  id: string;
}

export interface NewProduct {
  SKUPai: string;
  nome: string;
  /** Opcional na leitura — produtos cadastrados antes desse campo existir não têm marca. */
  marca?: string;
  /** Idem — não existia até agora. */
  categoria?: string;
  variacoes: ProductVariation[];
}

/** Um produto já salvo — igual a NewProduct, mas com o ID real do documento e quando foi criado. */
export interface Product extends NewProduct {
  id: string;
  /** Ausente em produtos cadastrados antes desse campo existir. */
  criadoEm?: Timestamp;
}

export interface DuplicateSkuResult {
  hasDuplicate: boolean;
  /** Qual SKU já existe e em qual produto — pra mostrar uma mensagem específica, não genérica. */
  duplicateSku?: string;
  existingProductName?: string;
}

@Service()
export class ProductsService {
  private readonly productsCollection = collection(db, 'products');

  /** Mesmo formato de documento que o app antigo já grava — sem isso, o Firestore fica com dois padrões misturados. */
  add(product: NewProduct): Observable<void> {
    const promise = addDoc(this.productsCollection, { ...product, criadoEm: serverTimestamp() }).then(() => {});
    return from(promise);
  }

  /** Busca única (não fica escutando mudanças) — reaplica ao revisitar a página. */
  list(): Observable<Product[]> {
    const promise = getDocs(this.productsCollection).then((snapshot) =>
      snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as NewProduct) }))
    );
    return from(promise);
  }

  remove(productId: string): Observable<void> {
    const productRef = doc(db, 'products', productId);
    const promise = deleteDoc(productRef).then(() => {});
    return from(promise);
  }

  /**
   * Confere SKU pai e todos os SKUs filho contra o catálogo inteiro.
   * O SKU filho vive dentro de um array aninhado — o Firestore não consegue
   * consultar isso direto, então a checagem é feita em memória, comparando
   * contra tudo que já existe.
   */
  checkDuplicateSku(skuPai: string, skusFilho: string[]): Observable<DuplicateSkuResult> {
    return this.list().pipe(
      map((products) => {
        const normalizedSkuPai = skuPai.trim().toUpperCase();
        const normalizedSkusFilho = skusFilho.map((s) => s.trim().toUpperCase());

        for (const product of products) {
          if (product.SKUPai.trim().toUpperCase() === normalizedSkuPai) {
            return { hasDuplicate: true, duplicateSku: product.SKUPai, existingProductName: product.nome };
          }
          for (const variacao of product.variacoes) {
            if (normalizedSkusFilho.includes(variacao.SKUFilho.trim().toUpperCase())) {
              return { hasDuplicate: true, duplicateSku: variacao.SKUFilho, existingProductName: product.nome };
            }
          }
        }

        return { hasDuplicate: false };
      })
    );
  }

  /**
   * O Firestore não deixa atualizar um campo dentro de um objeto que está
   * dentro de um array (não existe "variacoes[2].estoque" como caminho de
   * update). Só dá pra reescrever o array inteiro. Por isso recebe a lista
   * completa de variações já com o valor novo, não só o id + valor mudado.
   */
  updateVariacaoStock(productId: string, variacoes: ProductVariation[]): Observable<void> {
    const productRef = doc(db, 'products', productId);
    const promise = updateDoc(productRef, { variacoes }).then(() => {});
    return from(promise);
  }
}