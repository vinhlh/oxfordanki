import urllib
import genanki
import urllib.request
from flask import send_file, make_response
import random

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36 SE 2.X MetaSr 1.0')]
urllib.request.install_opener(opener)

def generate_id():
  return random.randrange(1 << 30, 1 << 31)

def read_mp3(url):
  file_name = url.split('/')[-1]
  file_path = "/tmp/" + file_name
  urllib.request.urlretrieve(url, file_path)
  return file_path, file_name

def generate_apkg(req):
  if req.method == 'OPTIONS':
    # Allows GET requests from any origin with the Content-Type
    # header and caches preflight response for an 3600s
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }

    return ('', 204, headers)

  json = req.get_json()
  deck = json['deck'] if json['deck'] else 'oxfordanki'
  words = json['words']

  if not words:
    return ('words is required', 400, {})

  d = genanki.Deck(deck_id=generate_id(), name=deck)
  m = genanki.Model(
    model_id=generate_id(),
    name=deck,
    fields=[
      {'name': 'Name'},
      {'name': 'Pos'},
      {'name': 'Definition'},
      {'name': 'Example'},
      {'name': 'Sound'},
      {'name': 'Phon'},
    ],
    templates=[
      {
        'name': 'Card 1',
        'qfmt': '{{Name}} ({{Pos}}) <br> {{Phon}} {{Sound}}',
        'afmt': '{{Definition}} <br> {{Example}}',
      },
      {
        'name': 'Card 2',
        'qfmt': '{{type:Name}} ({{Pos}}) <br> {{Phon}} {{Sound}}',
        'afmt': '{{FrontSide}} <hr id=answer> {{Name}}',
      },
    ])

  media_files = []
  for v in words:
    file_path, file_name = read_mp3(v['soundBr'])

    n = genanki.Note(
      model=m,
      fields=[v['name'], v['pos'], v['definition'], v['example'], "[sound:" + file_name + "]", v['phonBr']])

    media_files.append(file_path)
    d.add_note(n)

  p = genanki.Package(d)
  p.media_files = media_files
  output_file = "/tmp/" + 'oxfordanki.apkg'
  p.write_to_file(output_file)

  response = make_response(send_file(output_file, as_attachment=True))
  response.headers["Access-Control-Allow-Origin"] = "*"
  return response
