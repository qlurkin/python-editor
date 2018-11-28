from browser import window
import sys
import traceback

class cOutput:
    encoding = 'utf-8'

    def __init__(self):
        self.output = ''
        self.buf = ''

    def write(self, data):
        self.buf += str(data)

    def flush(self):
        self.output += self.buf
        self.buf = ''

    def __len__(self):
        return len(self.buf)

def pythonExec(src, fs={}):
    cOut = cOutput()
    stdout = sys.stdout
    sys.stdout = cOut
    stderr = sys.stderr
    sys.stderr = cOut

    try:
        exec(src, {})
    except Exception:
        traceback.print_exc(file=sys.stderr)
    
    sys.stdout.flush()
    sys.stdout = stdout
    sys.stderr = stderr

    return cOut.output

window.pythonExec._run = pythonExec
window.pythonExec.resolve()