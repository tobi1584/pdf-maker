import { chromium } from 'playwright'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { mkdir, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const browser = await chromium.launch({
  executablePath: process.env.BRAVE_EXECUTABLE || 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  headless: true,
})
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173/')
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click()
  assert.equal(await page.locator('.app.dark').count(), 1, 'No se activó el modo oscuro')
  await page.reload()
  assert.equal(await page.locator('.app.dark').count(), 1, 'No se conservó el modo oscuro')
  await page.getByRole('button', { name: 'Activar modo claro' }).click()
  const customInput = page.getByLabel('Añadir color personalizado')
  const customPalette = page.getByRole('group', { name: 'Colores personalizados' })
  for (const color of ['#112233', '#223344', '#334455', '#445566', '#556677', '#667788']) {
    await customInput.fill(color)
  }
  assert.deepEqual(await customPalette.locator('button.color-button').evaluateAll(buttons => buttons.map(button => button.style.backgroundColor)), [
    'rgb(34, 51, 68)', 'rgb(51, 68, 85)', 'rgb(68, 85, 102)', 'rgb(85, 102, 119)', 'rgb(102, 119, 136)',
  ], 'La paleta personalizada no siguió el orden FIFO')
  await page.reload()
  assert.equal(await page.getByRole('group', { name: 'Colores personalizados' }).locator('button.color-button').count(), 5, 'No se conservaron los colores personalizados')
  const source = await PDFDocument.create()
  const first = source.addPage([500, 700])
  const font = await source.embedFont(StandardFonts.Helvetica)
  first.drawText('Texto seleccionable para subrayar', { x: 70, y: 600, size: 18, font })
  first.drawText('Segunda línea de prueba', { x: 70, y: 570, size: 18, font })
  source.addPage([500, 700])
  const pdf = await source.save()
  await page.locator('input[type="file"]').setInputFiles({ name: 'prueba.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf) })
  const layer = page.locator('#pdf-page-1 svg.annotation-layer')
  await layer.waitFor()
  const bounds = await layer.boundingBox()
  assert(bounds, 'No se ha dibujado la primera página')
  const at = (x, y) => ({ x: bounds.x + x, y: bounds.y + y })
  const drag = async (x1, y1, x2, y2) => {
    await page.mouse.move(at(x1, y1).x, at(x1, y1).y)
    await page.mouse.down()
    await page.mouse.move(at(x2, y2).x, at(x2, y2).y, { steps: 8 })
    await page.mouse.up()
  }

  const textSpan = page.locator('.pdf-text-layer span').filter({ hasText: 'Texto seleccionable' }).first()
  await textSpan.waitFor()
  const textBox = await textSpan.boundingBox()
  assert(textBox, 'No se ha creado una capa de texto seleccionable')
  const selectWords = async (left, right) => {
    await page.mouse.move(textBox.x + left, textBox.y + textBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(textBox.x + right, textBox.y + textBox.height / 2, { steps: 8 })
    await page.mouse.up()
  }
  await page.getByRole('button', { name: /Subrayar texto/ }).click()
  await selectWords(3, 80)
  assert.equal(await layer.locator('g[transform] > g').count(), 1, 'No se subrayó el texto seleccionado')
  const underline = layer.locator('g[transform] > g').first().locator('line').first()
  const underlineWidth = Math.abs(Number(await underline.getAttribute('x2')) - Number(await underline.getAttribute('x1')))
  assert(underlineWidth > 10 && underlineWidth < 150, 'El primer arrastre subrayó más texto del seleccionado')
  await page.mouse.click(textBox.x + 240, textBox.y + textBox.height + 12)
  assert.equal(await layer.locator('g[transform] > g').count(), 1, 'Un clic en el espacio entre líneas volvió a subrayar el texto')
  await page.mouse.move(textBox.x + 240, textBox.y + textBox.height + 12)
  await page.mouse.down()
  await page.mouse.move(textBox.x + 80, textBox.y + textBox.height / 2, { steps: 8 })
  await page.mouse.up()
  assert.equal(await layer.locator('g[transform] > g').count(), 1, 'Un arrastre desde un espacio en blanco subrayó el texto')
  await page.getByRole('button', { name: /Resaltar texto/ }).click()
  await selectWords(100, 210)
  assert.equal(await layer.locator('g[transform] > g').count(), 2, 'No se resaltó el texto seleccionado')

  await page.getByRole('button', { name: /Rotulador/ }).click()
  await drag(70, 100, 230, 120)
  assert.equal(await layer.locator('polyline').count(), 1, 'El rotulador no dibujó')

  await page.getByRole('button', { name: /Texto/ }).click()
  await drag(90, 180, 260, 240)
  const editor = page.getByRole('textbox', { name: 'Editar texto' })
  assert.equal(await editor.count(), 1, 'Arrastrar no creó el cuadro de texto')
  const initialEditor = await editor.boundingBox()
  assert(initialEditor && initialEditor.width >= 165 && initialEditor.height >= 55, 'El cuadro no respetó el tamaño arrastrado')
  await editor.fill('Prueba de texto')
  await page.mouse.click(at(300, 260).x, at(300, 260).y)
  assert.equal(await layer.locator('foreignObject').count(), 1, 'No se insertó el texto')
  await page.mouse.click(at(110, 195).x, at(110, 195).y)
  assert.equal(await editor.count(), 1, 'No se pudo reabrir el texto con la herramienta Texto')
  await editor.fill('Texto corregido')
  const beforeResize = await editor.boundingBox()
  await page.mouse.move(beforeResize.x + beforeResize.width - 3, beforeResize.y + beforeResize.height - 3)
  await page.mouse.down()
  await page.mouse.move(beforeResize.x + beforeResize.width + 45, beforeResize.y + beforeResize.height + 20, { steps: 6 })
  await page.mouse.up()
  const afterResize = await editor.boundingBox()
  assert(afterResize.width > beforeResize.width + 30, 'No se pudo ampliar el cuadro de texto')
  await page.mouse.click(at(330, 270).x, at(330, 270).y)
  await page.mouse.click(at(110, 195).x, at(110, 195).y)
  const reopenedSize = await editor.boundingBox()
  assert(reopenedSize.width > beforeResize.width + 30, 'No se guardó el tamaño modificado del cuadro de texto')
  await page.getByRole('button', { name: /Seleccionar/ }).click()

  await page.getByRole('button', { name: /Flecha/ }).click()
  await drag(90, 250, 230, 300)
  assert.equal(await layer.locator('g line').count() >= 3, true, 'No se dibujó la flecha')

  await page.getByRole('button', { name: /Rectángulo/ }).click()
  await drag(100, 350, 250, 440)
  assert.equal(await layer.locator('g rect').count() >= 1, true, 'No se dibujó el rectángulo')

  const penPoints = await layer.locator('polyline').first().getAttribute('points')
  await page.getByRole('button', { name: 'Aumentar zoom' }).click()
  assert.equal(await layer.locator('polyline').first().getAttribute('points'), penPoints, 'El zoom movió los puntos del trazo')
  const widthBeforeWheel = (await page.locator('#pdf-page-1').boundingBox()).width
  const sidebarWidth = (await page.locator('.sidebar').boundingBox()).width
  const pageBox = await page.locator('#pdf-page-1').boundingBox()
  await page.mouse.move(pageBox.x + 100, pageBox.y + 100)
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -120)
  await page.keyboard.up('Control')
  await page.waitForFunction(before => document.querySelector('#pdf-page-1').getBoundingClientRect().width > before, widthBeforeWheel)
  assert.equal((await page.locator('.sidebar').boundingBox()).width, sidebarWidth, 'El zoom modificó la barra lateral')
  assert.equal(await layer.locator('polyline').first().getAttribute('points'), penPoints, 'Ctrl + rueda desplazó el trazo')

  await page.getByRole('button', { name: /Mano/ }).click()
  const viewer = page.locator('.viewer')
  await viewer.evaluate(element => { element.scrollTop = 300 })
  const scrollBeforePan = await viewer.evaluate(element => element.scrollTop)
  const viewerBox = await viewer.boundingBox()
  await page.mouse.move(viewerBox.x + viewerBox.width / 2, viewerBox.y + viewerBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(viewerBox.x + viewerBox.width / 2, viewerBox.y + viewerBox.height / 2 + 100, { steps: 6 })
  await page.mouse.up()
  assert.notEqual(await viewer.evaluate(element => element.scrollTop), scrollBeforePan, 'La mano no desplazó el PDF')
  assert.equal(await page.evaluate(() => window.getSelection()?.toString()), '', 'La mano seleccionó contenido de la página')

  await page.getByRole('button', { name: /Borrador/ }).click()
  const beforeErase = await layer.locator('g[transform] > g').count()
  await layer.locator('g[transform] > g').last().locator('rect').last().click()
  assert.equal(await layer.locator('g[transform] > g').count(), beforeErase - 1, 'El borrador no eliminó la anotación')
  await page.getByRole('button', { name: /Deshacer/ }).click()
  assert.equal(await layer.locator('g[transform] > g').count(), beforeErase, 'Deshacer no restauró la anotación')
  await page.getByRole('button', { name: /Rehacer/ }).click()
  assert.equal(await layer.locator('g[transform] > g').count(), beforeErase - 1, 'Rehacer no eliminó de nuevo la anotación')

  const sidebarTop = (await page.locator('.sidebar').boundingBox()).y
  const topbarTop = (await page.locator('.topbar').boundingBox()).y
  await page.locator('.viewer').evaluate(element => { element.scrollTop = element.scrollHeight })
  assert.equal((await page.locator('.sidebar').boundingBox()).y, sidebarTop, 'La barra lateral se desplazó con el PDF')
  assert.equal((await page.locator('.topbar').boundingBox()).y, topbarTop, 'La barra superior se desplazó con el PDF')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Descargar PDF/ }).click()
  const download = await downloadPromise
  const output = await PDFDocument.load(await readFile(await download.path()))
  assert.equal(output.getPageCount(), 2, 'La exportación perdió páginas')
  assert.equal(errors.length, 0, `Errores del navegador: ${errors.join('; ')}`)
  if (process.env.APUNTES_SCREENSHOT) {
    await viewer.evaluate(element => { element.scrollTop = 0 })
    await page.getByRole('button', { name: 'Activar modo oscuro' }).click()
    await mkdir('test-output', { recursive: true })
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.tool-button')).color === 'rgb(196, 208, 225)')
    const colors = await page.evaluate(() => ({ tool: getComputedStyle(document.querySelector('.tool-button')).color, active: getComputedStyle(document.querySelector('.tool-button.active')).backgroundColor, toggle: getComputedStyle(document.querySelector('.theme-toggle')).backgroundColor }))
    assert.equal(colors.tool, 'rgb(196, 208, 225)', 'Las herramientas no tienen suficiente contraste en modo oscuro')
    assert.equal(colors.active, 'rgb(40, 73, 119)', 'La herramienta activa no usa el estilo oscuro')
    assert.notEqual(colors.toggle, 'rgb(255, 255, 255)', 'El botón de tema no usa el estilo oscuro')
    await page.screenshot({ path: 'test-output/modo-oscuro.png' })
  }
  console.log('Brave: texto redimensionable y editable, subrayado, resaltado, herramientas, zoom, mano, modo oscuro y exportación correctos.')
} finally {
  await browser.close()
}
