export async function updateAnnotation(annotationId: number, content: string) {
  const annotation = await Zotero.Items.getAsync(annotationId)
  const comment = annotation.annotationComment ? annotation.annotationComment + '\n' + content : content
  annotation.annotationComment = comment
  await annotation.saveTx()
  return annotation
}
