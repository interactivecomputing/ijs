# IPython Configuration for ijs

import os

c = get_config()

# Kernel setup
kernel_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'index.js')
c.KernelManager.kernel_cmd = [ 'node', kernel_path, '{connection_file}' ]

# Protocol signing settings
c.Session.key = b''
c.Session.keyfile = b''

# Static files
c.NotebookApp.extra_static_paths = [
  os.path.join(os.path.dirname(__file__))
]

