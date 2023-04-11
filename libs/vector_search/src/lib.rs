use serde::{Deserialize, Serialize};
use kd_tree::{KdPoint, KdTree, KdTreeN};
use typenum::U2;
use serde_wasm_bindgen::{from_value, to_value, Error};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[cfg(test)]
use wasm_bindgen_test::*;

#[cfg(test)]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EmbeddedDocument {
    pub id: i32,
    pub embeddings: Vec<f32>,
    pub distance: Option<f32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Query {
    Embeddings(Vec<f32>),
}

impl KdPoint for EmbeddedDocument {
    type Scalar = f32;
    type Dim = U2; 
    fn at(&self, k: usize) -> f32 {
        self.embeddings[k]
    }
}

pub type Index = KdTreeN<EmbeddedDocument, U2>;

#[wasm_bindgen(js_name = createIndex)]
pub fn create_index(input: JsValue) -> Result<JsValue, JsValue> {

    let input: Vec<EmbeddedDocument> = from_value(input).map_err(|e| Error::new(format!("Failed to deserialize input: {}", e)))?;

    let data: Vec<EmbeddedDocument> = input
        .into_iter()
        .map(|emb| EmbeddedDocument {
            id: emb.id,
            embeddings: emb.embeddings,
            distance: None
        })
        .collect();

    let index = KdTree::build_by(data, |a, b, k| {
        a.embeddings
            .clone()
            .into_iter()
            .nth(k)
            .partial_cmp(&b.embeddings.clone().into_iter().nth(k))
            .unwrap()
    });
    return to_value(&index).map_err(|_| Error::new("Failed to serialize index").into())
}

fn euclidean_distance(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len(), "Vectors must have the same length");

    let distance_squared: f32 = a.iter()
        .zip(b.iter())
        .map(|(a_i, b_i)| (a_i - b_i).powi(2))
        .sum();

    distance_squared.sqrt()
}

#[wasm_bindgen(js_name = runSearch)]
pub fn run_search(index: JsValue, query: JsValue, k: usize) -> Result<JsValue, JsValue> {

    let index: Index = from_value(index).map_err(|e| Error::new(format!("Failed to deserialize index: {}", e)))?;

    let query: Result<Vec<f32>, Error> = from_value(query);
    let query: Query = match query {
        Ok(q) => Query::Embeddings(q),
        _ => Query::Embeddings(vec![]),
    };

    let query: Vec<f32> = match &query {
        Query::Embeddings(q) => q.to_owned(),
    };
    let query = EmbeddedDocument {
        id: -1,
        embeddings: query,
        distance: None
    };
    let nearests: Vec<EmbeddedDocument> = index
        .nearests(&query, k)
        .into_iter()
        .map(|x| {
            let mut item = x.item.to_owned();
            item.distance = Some(euclidean_distance(x.item.embeddings.as_slice(), query.embeddings.as_slice()));
            item
        })
        .collect();

    Ok(to_value(&nearests).map_err(|e| JsValue::from_str(&format!("Failed to serialize results: {}", e)))?)
}

#[cfg(test)]
mod tests {
    use super::{create_index, run_search, Query};
    use crate::Embedding;
    use serde_wasm_bindgen::{from_value, to_value};

    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }

    #[test]
    fn it_indexes_embeddings_and_returns_search_result() {
        let embeddings: Vec<Embedding> = vec![
            Embedding {
                id: 0,
                embeddings: vec![1.0, 2.0, 3.0],
            },
            Embedding {
                id: 1,
                embeddings: vec![3.0, 1.0, 2.0],
            },
            Embedding {
                id: 2,
                embeddings: vec![2.0, 3.0, 1.0],
            },
        ];

        let input = to_value(&embeddings).unwrap();
        let index = create_index(input).unwrap();
        let query = Query::Embeddings(vec![3.1, 0.9, 2.1]);
        let query_js = to_value(&query).unwrap();
        let result = run_search(index, query_js, 1).unwrap();
        let result: Vec<Embedding> = from_value(result).unwrap();
        assert_eq!(
            result.into_iter().nth(0).unwrap().id,
            1,
        );
    }
}