"""
Thulirinfo Tech — Professional Invoice PDF Generator
Modern green theme | ReportLab Platypus | A4
"""
import os
from io import BytesIO
import cloudinary.uploader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, Image,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.conf import settings

# ── Try to register a Unicode font for Rs symbol ─────────────────────────────
# Falls back gracefully to Helvetica + "Rs." if no TTF found
_FONT_NORMAL = 'Helvetica'
_FONT_BOLD   = 'Helvetica-Bold'

def _try_register_unicode_font():
    """Attempt to register DejaVu or Arial Unicode for rupee support."""
    global _FONT_NORMAL, _FONT_BOLD
    candidates = [
        # Windows paths
        (r'C:\Windows\Fonts\Arial.ttf',        r'C:\Windows\Fonts\Arialbd.ttf'),
        (r'C:\Windows\Fonts\calibri.ttf',      r'C:\Windows\Fonts\calibrib.ttf'),
        (r'C:\Windows\Fonts\NotoSans-Regular.ttf', r'C:\Windows\Fonts\NotoSans-Bold.ttf'),
    ]
    for reg, bold in candidates:
        try:
            if os.path.exists(reg) and os.path.exists(bold):
                pdfmetrics.registerFont(TTFont('CustomRegular', reg))
                pdfmetrics.registerFont(TTFont('CustomBold',    bold))
                _FONT_NORMAL = 'CustomRegular'
                _FONT_BOLD   = 'CustomBold'
                return True
        except Exception:
            continue
    return False

_unicode_ok = _try_register_unicode_font()

def _rs(amount):
    """Format currency — uses Rs. with Helvetica, rupee symbol if Unicode font found."""
    symbol = '\u20b9' if _unicode_ok else 'Rs.'
    return f"{symbol}{float(amount):,.2f}"


# ── Brand Colors ─────────────────────────────────────────────────────────────
GREEN       = colors.HexColor('#16a34a')
GREEN_DARK  = colors.HexColor('#15803d')
GREEN_LIGHT = colors.HexColor('#dcfce7')
GREEN_MID   = colors.HexColor('#bbf7d0')
WHITE       = colors.white
DARK        = colors.HexColor('#1f2937')
MID_GRAY    = colors.HexColor('#6b7280')
LIGHT_GRAY  = colors.HexColor('#f9fafb')
BORDER      = colors.HexColor('#e5e7eb')

# ── Page geometry ─────────────────────────────────────────────────────────────
PAGE_W = A4[0] - 36 * mm   # usable width  ≈ 174 mm


# ── Main entry point ──────────────────────────────────────────────────────────
def generate_invoice_pdf(invoice):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=14 * mm,  bottomMargin=18 * mm,
    )

    story = [
        _header(invoice),
        Spacer(1, 4 * mm),
        HRFlowable(width='100%', thickness=2.5, color=GREEN, spaceAfter=6 * mm),
        _bill_row(invoice),
        Spacer(1, 7 * mm),
        _items_table(invoice),
        Spacer(1, 5 * mm),
        _totals_block(invoice),
        Spacer(1, 5 * mm),
        _status_badge(invoice),
        Spacer(1, 7 * mm),
    ]

    if invoice.notes:
        story += [_notes_block(invoice), Spacer(1, 6 * mm)]

    story += [
        HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=4 * mm),
        _footer(),
    ]

    doc.build(story)

    # Upload PDF bytes to Cloudinary
    result = cloudinary.uploader.upload(
        buffer.getvalue(),
        public_id=f"invoices/{invoice.invoice_number}",
        resource_type="raw",
        overwrite=True,
        format="pdf",
    )
    return result['secure_url']


# ── Style helpers ─────────────────────────────────────────────────────────────
def _s(name, size, bold=False, color=DARK, align=TA_LEFT,
        leading=None, after=0, before=0):
    return ParagraphStyle(
        name,
        fontName=_FONT_BOLD if bold else _FONT_NORMAL,
        fontSize=size,
        textColor=color,
        alignment=align,
        leading=leading or size * 1.35,
        spaceAfter=after,
        spaceBefore=before,
    )


# ── Section builders ──────────────────────────────────────────────────────────

def _header(invoice):
    """[Logo  Company details]  ⟷  [INVOICE title + number/dates]"""

    # Logo
    logo_path = str(getattr(settings, 'COMPANY_LOGO', ''))
    if logo_path and os.path.exists(logo_path):
        logo = Image(logo_path, width=20 * mm, height=20 * mm)
    else:
        logo = _box_placeholder('TIT', 20 * mm, 20 * mm)

    # Company text
    co_rows = [
        [Paragraph(settings.COMPANY_NAME,
                   _s('cn', 14, bold=True, color=GREEN_DARK, after=1))],
        [Paragraph(settings.COMPANY_ADDRESS.replace('\n', '<br/>'),
                   _s('ca', 7.5, color=MID_GRAY, leading=11))],
        [Paragraph(f"Email: {settings.COMPANY_EMAIL}",
                   _s('ce', 7.5, color=MID_GRAY))],
        [Paragraph(f"Phone: {settings.COMPANY_PHONE}",
                   _s('cp', 7.5, color=MID_GRAY))],
        [Paragraph(f"Website: {settings.COMPANY_WEBSITE}",
                   _s('cw', 7.5, color=MID_GRAY))],
    ]
    co_t = Table(co_rows, colWidths=[85 * mm])
    co_t.setStyle(TableStyle([
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))

    left_inner = Table([[logo, co_t]], colWidths=[22 * mm, 85 * mm])
    left_inner.setStyle(_no_padding_style())

    # Invoice meta (right side)
    lbl = _s('ml', 7.5, color=MID_GRAY, align=TA_RIGHT)
    val = _s('mv', 8,   bold=True, color=DARK, align=TA_RIGHT)

    def date_row(label, value):
        t = Table([[Paragraph(label, lbl), Paragraph(value, val)]],
                  colWidths=[26 * mm, 32 * mm])
        t.setStyle(TableStyle([
            ('LEFTPADDING',   (0, 0), (-1, -1), 0),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
            ('TOPPADDING',    (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LINEBELOW',     (0, 0), (-1, 0), 0.4, BORDER),
        ]))
        return t

    meta_rows = [
        [Paragraph('INVOICE', _s('it', 30, bold=True, color=GREEN, align=TA_RIGHT))],
        [Paragraph(invoice.invoice_number,
                   _s('inum', 10, bold=True, color=DARK, align=TA_RIGHT, after=3))],
        [date_row('Issue Date', str(invoice.issue_date))],
        [date_row('Due Date',   str(invoice.due_date))],
    ]
    meta_t = Table(meta_rows, colWidths=[58 * mm])
    meta_t.setStyle(_no_padding_style())

    left_w  = PAGE_W - 58 * mm
    outer   = Table([[left_inner, meta_t]], colWidths=[left_w, 58 * mm])
    outer.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return outer


def _bill_row(invoice):
    """Green-label Bill-To block."""
    client = invoice.client

    lbl_s  = _s('bl', 7, bold=True, color=WHITE)
    name_s = _s('bn', 11, bold=True, color=DARK, after=2)
    val_s  = _s('bv', 8, color=MID_GRAY, leading=13)

    rows = [[Paragraph('  BILL TO', lbl_s)],
            [Paragraph(client.name, name_s)]]
    if client.company_name:
        rows.append([Paragraph(client.company_name, val_s)])
    rows.append([Paragraph(client.email, val_s)])
    rows.append([Paragraph(client.phone, val_s)])
    rows.append([Paragraph(client.address.replace('\n', '<br/>'), val_s)])

    t = Table(rows, colWidths=[PAGE_W])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (0, 0), GREEN),
        ('TOPPADDING',    (0, 0), (0, 0), 5),
        ('BOTTOMPADDING', (0, 0), (0, 0), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
    ]))
    return t


def _items_table(invoice):
    """Items table with green header row."""
    hdr  = _s('th', 8, bold=True, color=WHITE, align=TA_CENTER)
    idx  = _s('ti', 8, color=MID_GRAY, align=TA_CENTER)
    svc  = _s('ts', 8, bold=True, color=DARK)
    dsc  = _s('td', 7, color=MID_GRAY, leading=10)
    num  = _s('tn', 8, color=DARK, align=TA_RIGHT)
    tot  = _s('tt', 8, bold=True, color=DARK, align=TA_RIGHT)

    data = [[
        Paragraph('#',                     hdr),
        Paragraph('Service / Description', hdr),
        Paragraph('Qty',                   hdr),
        Paragraph('Unit Price',            hdr),
        Paragraph('Total',                 hdr),
    ]]

    for i, item in enumerate(invoice.items.all(), 1):
        svc_cell = Table(
            [[Paragraph(item.service_name, svc)],
             [Paragraph(item.description or '', dsc)]],
            colWidths=[None],
        )
        svc_cell.setStyle(_no_padding_style())

        data.append([
            Paragraph(str(i), idx),
            svc_cell,
            Paragraph(str(item.quantity), num),
            Paragraph(_rs(item.price), num),
            Paragraph(_rs(item.total),  tot),
        ])

    # Column widths — all in mm units
    c0 = 10 * mm
    c2 = 18 * mm
    c3 = 32 * mm
    c4 = 34 * mm
    c1 = PAGE_W - c0 - c2 - c3 - c4   # remaining space

    t = Table(data, colWidths=[c0, c1, c2, c3, c4], repeatRows=1)
    t.setStyle(TableStyle([
        # Header
        ('BACKGROUND',    (0, 0), (-1, 0), GREEN),
        ('TOPPADDING',    (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING',   (0, 0), (-1, 0), 6),
        ('RIGHTPADDING',  (0, 0), (-1, 0), 6),
        # Data rows
        ('TOPPADDING',    (0, 1), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 7),
        ('LEFTPADDING',   (0, 1), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 1), (-1, -1), 6),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('LINEBELOW',     (0, 0), (-1, -1), 0.5, BORDER),
        ('BOX',           (0, 0), (-1, -1), 1,   BORDER),
    ]))
    return t


def _totals_block(invoice):
    """Right-aligned totals table."""
    lbl = _s('sl', 8,  color=MID_GRAY, align=TA_RIGHT)
    val = _s('sv', 8,  bold=True, color=DARK, align=TA_RIGHT)
    gtl = _s('gl', 11, bold=True, color=WHITE, align=TA_RIGHT)
    gtv = _s('gv', 11, bold=True, color=WHITE, align=TA_RIGHT)

    rows = [
        [Paragraph('Subtotal',                        lbl), Paragraph(_rs(invoice.subtotal),    val)],
        [Paragraph(f'GST ({invoice.tax_percentage}%)',lbl), Paragraph(_rs(invoice.tax_amount),  val)],
        [Paragraph('Discount',                        lbl), Paragraph(f'- {_rs(invoice.discount)}', val)],
        [Paragraph('GRAND TOTAL',                     gtl), Paragraph(_rs(invoice.total_amount), gtv)],
    ]

    inner_w = 92 * mm
    c1, c2  = 54 * mm, 38 * mm

    inner = Table(rows, colWidths=[c1, c2])
    inner.setStyle(TableStyle([
        ('ROWBACKGROUNDS',(0, 0), (-1, -2), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING',    (0, 0), (-1, -2), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -2), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('LINEBELOW',     (0, 0), (-1, -2), 0.4, GREEN_MID),
        ('BACKGROUND',    (0, -1), (-1, -1), GREEN),
        ('TOPPADDING',    (0, -1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 9),
        ('BOX',           (0, 0), (-1, -1), 1, BORDER),
    ]))

    spacer_w = PAGE_W - inner_w
    outer = Table([[Spacer(1, 1), inner]], colWidths=[spacer_w, inner_w])
    outer.setStyle(_no_padding_style())
    return outer


def _status_badge(invoice):
    """Right-aligned coloured status badge."""
    status_map = {
        'paid':      ('PAID',      GREEN,                        GREEN_LIGHT,
                                   colors.HexColor('#166534')),
        'unpaid':    ('UNPAID',    colors.HexColor('#d97706'),
                                   colors.HexColor('#fef9c3'),   colors.HexColor('#78350f')),
        'overdue':   ('OVERDUE',   colors.HexColor('#dc2626'),
                                   colors.HexColor('#fee2e2'),   colors.HexColor('#7f1d1d')),
        'cancelled': ('CANCELLED', MID_GRAY, LIGHT_GRAY, DARK),
    }
    label, border_c, bg_c, text_c = status_map.get(invoice.status, status_map['unpaid'])

    badge_s = _s('bs', 10, bold=True, color=text_c, align=TA_CENTER)
    badge_w = 50 * mm
    badge   = Table([[Paragraph(f'Status: {label}', badge_s)]],
                    colWidths=[badge_w], rowHeights=[16 * mm])
    badge.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), bg_c),
        ('BOX',           (0, 0), (-1, -1), 2, border_c),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    outer = Table([[Spacer(1, 1), badge]],
                  colWidths=[PAGE_W - badge_w, badge_w])
    outer.setStyle(_no_padding_style())
    return outer


def _notes_block(invoice):
    t = Table(
        [[Paragraph('Notes:', _s('nl', 8, bold=True, color=GREEN_DARK, after=3))],
         [Paragraph(invoice.notes.replace('\n', '<br/>'),
                    _s('nt', 8, color=MID_GRAY, leading=13))]],
        colWidths=[PAGE_W],
    )
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), GREEN_LIGHT),
        ('BOX',           (0, 0), (-1, -1), 1, GREEN_MID),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
        ('TOPPADDING',    (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


def _footer():
    bold  = _s('ft', 10, bold=True, color=GREEN_DARK, align=TA_CENTER, after=3)
    info  = _s('fi', 7.5, color=MID_GRAY, align=TA_CENTER, leading=12)
    disc  = _s('fd', 6.5, color=MID_GRAY, align=TA_CENTER)

    t = Table(
        [
            [Paragraph('Thank you for choosing Thulirinfo Tech', bold)],
            [Paragraph(
                f'Email: {settings.COMPANY_EMAIL}   |   '
                f'Phone: {settings.COMPANY_PHONE}   |   '
                f'Website: {settings.COMPANY_WEBSITE}',
                info,
            )],
            [Spacer(1, 3)],
            [Paragraph(
                'This is a computer-generated invoice and does not require a physical signature.',
                disc,
            )],
        ],
        colWidths=[PAGE_W],
    )
    t.setStyle(TableStyle([
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    return t


# ── Utilities ─────────────────────────────────────────────────────────────────

def _no_padding_style():
    return TableStyle([
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ])


def _box_placeholder(text, w, h):
    """Green box with text — used when logo file is missing."""
    t = Table(
        [[Paragraph(f'<b>{text}</b>',
                    _s('ph', 11, bold=True, color=WHITE, align=TA_CENTER))]],
        colWidths=[w], rowHeights=[h],
    )
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), GREEN),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
    ]))
    return t
