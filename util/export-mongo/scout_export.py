"""
GUI tool to find mongo databases in running containers and 
export to json files in a target directory.

Usage:
Open GUI: `python ScoutExport.py`

1. Left side: select the container with the scout instance
2. Right side: click 'get databases' to see list of dbs
3. Select the scout database (beginning with 'scout-')
4. Choose an export folder and click 'export collections'.
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import os
import threading
from pathlib import Path
import tarfile
import docker

class MongoDockerExporter(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("MongoDB Docker Export Tool")
        self.geometry("850x700")  # Increased height further
        self.minsize(800, 600)    # Increased minimum size
        
        # Initialize Docker client
        self.docker_client = docker.from_env()
        
        # Configure root window grid
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=1)
        
        # Create main frame with padding
        self.main_frame = ttk.Frame(self, padding="10")
        self.main_frame.grid(row=0, column=0, sticky="nsew")
        self.main_frame.grid_rowconfigure(0, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        # Create UI elements
        self._create_widgets()
        
        # Status variables
        self.selected_container = None
        self.selected_db = None
        self.target_directory = None
        
    def _create_widgets(self):
        # Configure main frame to expand
        self.main_frame.grid_rowconfigure(0, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        # Create and configure style for Treeview
        style = ttk.Style()
        style.configure("Treeview", rowheight=30)  # Increase row height to 30 pixels
        
        # Create paned window to allow resizable sections
        self.paned_window = ttk.PanedWindow(self.main_frame, orient=tk.VERTICAL)
        self.paned_window.grid(row=0, column=0, sticky="nsew")
        
        # Top section with container and database selection
        top_frame = ttk.Frame(self.paned_window)
        top_frame.grid_rowconfigure(0, weight=1)
        top_frame.grid_columnconfigure(0, weight=1)
        self.paned_window.add(top_frame, weight=3)
        
        # Create top control panel with grid layout
        controls_frame = ttk.Frame(top_frame)
        controls_frame.grid(row=0, column=0, sticky="nsew", pady=5)
        controls_frame.grid_rowconfigure(0, weight=1)
        controls_frame.grid_columnconfigure(0, weight=1)
        controls_frame.grid_columnconfigure(1, weight=1)
        
        # Left side: Container selection
        container_frame = ttk.LabelFrame(controls_frame, text="Step 1: Select MongoDB Container", padding="5")
        container_frame.grid(row=0, column=0, sticky="nsew", padx=5)
        container_frame.grid_rowconfigure(0, weight=1)
        container_frame.grid_columnconfigure(0, weight=1)
        
        # Container list with scrollbar
        container_list_frame = ttk.Frame(container_frame)
        container_list_frame.grid(row=0, column=0, sticky="nsew")
        container_list_frame.grid_rowconfigure(0, weight=1)
        container_list_frame.grid_columnconfigure(0, weight=1)
        
        self.container_tree = ttk.Treeview(container_list_frame, columns=("name", "status"), 
                                          show="headings")  # Removed fixed height
        self.container_tree.grid(row=0, column=0, sticky="nsew")
        self.container_tree.heading("name", text="Container Name")
        self.container_tree.heading("status", text="Status")
        # Make columns expand proportionally
        container_list_frame.grid_columnconfigure(0, weight=3)  # Name column wider
        self.container_tree.column("name", width=200, minwidth=150)
        self.container_tree.column("status", width=100, minwidth=80)
        
        container_scrollbar = ttk.Scrollbar(container_list_frame, orient=tk.VERTICAL, 
                                          command=self.container_tree.yview)
        container_scrollbar.grid(row=0, column=1, sticky="ns")
        self.container_tree.configure(yscrollcommand=container_scrollbar.set)
        
        ttk.Button(container_frame, text="Refresh Containers", 
                   command=self.refresh_containers).grid(row=1, column=0, pady=2, sticky="ew")
        
        # Right side: Database selection
        db_frame = ttk.LabelFrame(controls_frame, text="Step 2: Select 'scout-' Database", padding="5")
        db_frame.grid(row=0, column=1, sticky="nsew", padx=5)
        db_frame.grid_rowconfigure(0, weight=1)
        db_frame.grid_columnconfigure(0, weight=1)
        
        # Database list with scrollbar
        db_list_frame = ttk.Frame(db_frame)
        db_list_frame.grid(row=0, column=0, sticky="nsew")
        db_list_frame.grid_rowconfigure(0, weight=1)
        db_list_frame.grid_columnconfigure(0, weight=1)
        
        self.db_tree = ttk.Treeview(db_list_frame, columns=("name"), show="headings")  # Removed fixed height
        self.db_tree.grid(row=0, column=0, sticky="nsew")
        self.db_tree.heading("name", text="Database Name")
        self.db_tree.column("name", width=300, minwidth=230)
        
        db_scrollbar = ttk.Scrollbar(db_list_frame, orient=tk.VERTICAL, 
                                    command=self.db_tree.yview)
        db_scrollbar.grid(row=0, column=1, sticky="ns")
        self.db_tree.configure(yscrollcommand=db_scrollbar.set)
        
        ttk.Button(db_frame, text="Get Databases", 
                   command=self.get_databases).grid(row=1, column=0, pady=2, sticky="ew")
        
        # Bottom section with export options and status
        bottom_frame = ttk.Frame(self.paned_window)
        self.paned_window.add(bottom_frame, weight=1)
        
        # Export options
        export_frame = ttk.LabelFrame(bottom_frame, text="Export Options", padding="5")
        export_frame.pack(fill=tk.X, pady=5)
        export_frame.grid_columnconfigure(1, weight=1)
        
        # Directory selection
        ttk.Label(export_frame, text="Export Directory:").grid(row=0, column=0, padx=5)
        self.dir_var = tk.StringVar()
        dir_entry = ttk.Entry(export_frame, textvariable=self.dir_var)
        dir_entry.grid(row=0, column=1, padx=5, sticky="ew")
        ttk.Button(export_frame, text="Browse...", 
                   command=self.select_directory).grid(row=0, column=2, padx=5)
        
        # Export button
        ttk.Button(export_frame, text="Export Collections as JSON", 
                   command=self.export_collections).grid(row=1, column=0, 
                   columnspan=3, pady=5, sticky="ew")
        
        # Status frame
        status_frame = ttk.LabelFrame(bottom_frame, text="Status", padding="5")
        status_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        status_frame.grid_columnconfigure(0, weight=1)
        
        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(status_frame, textvariable=self.status_var, 
                  wraplength=650).pack(fill=tk.X)
        
        self.progress_var = tk.DoubleVar()
        self.progress = ttk.Progressbar(status_frame, orient=tk.HORIZONTAL, 
                                      variable=self.progress_var, maximum=100)
        self.progress.pack(fill=tk.X, pady=5)
        
        # Add event bindings
        self.container_tree.bind("<<TreeviewSelect>>", self.on_container_selected)
        self.db_tree.bind("<<TreeviewSelect>>", self.on_db_selected)
        
        # Load containers on startup
        self.after(100, self.refresh_containers)
    
    def refresh_containers(self):
        """Refresh the list of Docker containers"""
        self.status_var.set("Fetching Docker containers...")
        
        # Clear existing items
        for item in self.container_tree.get_children():
            self.container_tree.delete(item)
        
        try:
            containers = self.docker_client.containers.list(all=True)
            for container in containers:
                self.container_tree.insert("", "end", values=(container.name, container.status))
            
            self.status_var.set(f"Found {len(containers)} containers")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get containers: {str(e)}")
            self.status_var.set(f"Error: {str(e)}")
    
    def on_container_selected(self, event):
        """Handle container selection"""
        selection = self.container_tree.selection()
        if not selection:
            return
        
        container_name = self.container_tree.item(selection[0], "values")[0]
        self.selected_container = container_name
        self.status_var.set(f"Selected container: {container_name}")
    
    def get_databases(self):
        """Get MongoDB databases from the selected container"""
        if not self.selected_container:
            messagebox.showwarning("Warning", "Please select a Docker container first")
            return
        
        self.status_var.set(f"Connecting to MongoDB in container {self.selected_container}...")
        
        # Clear existing items
        for item in self.db_tree.get_children():
            self.db_tree.delete(item)
        
        try:
            # Try multiple methods to find MongoDB databases
            container = self.docker_client.containers.get(self.selected_container)
            
            # Method 1: Check if mongosh is available (newer MongoDB versions)
            cmd1 = "which mongosh"
            result1 = container.exec_run(cmd1)
            
            if result1.exit_code == 0:
                # Use mongosh
                cmd = "mongosh --quiet --eval 'db.adminCommand({listDatabases:1}).databases.forEach(function(d){ if(d.name.startsWith(\"scout-\")) { print(d.name); } })'"
            else:
                # Method 2: Try mongo (older MongoDB versions)
                cmd = "mongo --quiet --eval 'db.adminCommand({listDatabases:1}).databases.forEach(function(d){ if(d.name.startsWith(\"scout-\")) { print(d.name); } })'"
            
            result = container.exec_run(cmd)
            
            # If both failed, try using mongo with a different approach
            if result.exit_code != 0:
                # Show error but continue with alternative method
                self.status_var.set(f"Standard MongoDB client commands failed, trying alternative method...")
                
                # Try with mongod command to find MongoDB data directory
                cmd_alt = "ps aux | grep mongod"
                result_alt = container.exec_run(cmd_alt)
                
                # Try listing the database directory directly
                cmd_dir = "find /data -name \"scout-*\" -type d 2>/dev/null || find /var/lib/mongodb -name \"scout-*\" -type d 2>/dev/null"
                result_dir = container.exec_run(cmd_dir)
                
                # If we found directories, extract database names
                if result_dir.exit_code == 0 and result_dir.output.decode('utf-8').strip():
                    dir_output = result_dir.output.decode('utf-8').strip().split('\n')
                    scout_dbs = [os.path.basename(d) for d in dir_output if d]
                else:
                    # Last resort: prompt user to enter the database name manually
                    self.status_var.set("Could not automatically detect databases. Please enter the database name manually.")
                    scout_db = simpledialog.askstring("Database Name", "Enter the scout database name (starts with 'scout-'):")
                    scout_dbs = [scout_db] if scout_db and scout_db.startswith('scout-') else []
            else:
                # Parse the output from the successful MongoDB command
                databases = result.output.decode('utf-8').strip().split('\n')
                scout_dbs = [db for db in databases if db and db.startswith('scout-')]
            
            # Add databases to the treeview
            for db in scout_dbs:
                if db:  # Skip empty names
                    self.db_tree.insert("", "end", values=(db,))
            
            if scout_dbs:
                self.status_var.set(f"Found {len(scout_dbs)} scout databases")
            else:
                # If no databases found, show error and give manual option
                self.status_var.set("No 'scout-' databases found. You may need to enter the name manually.")
                scout_db = simpledialog.askstring("Database Name", "Enter the scout database name (starts with 'scout-'):")
                if scout_db and scout_db.startswith('scout-'):
                    self.db_tree.insert("", "end", values=(scout_db,))
                    self.status_var.set(f"Manually added database: {scout_db}")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get databases: {str(e)}")
            self.status_var.set(f"Error: {str(e)}")
            # Give option to manually enter database name
            scout_db = simpledialog.askstring("Database Name", "Enter the scout database name (starts with 'scout-'):")
            if scout_db and scout_db.startswith('scout-'):
                self.db_tree.insert("", "end", values=(scout_db,))
                self.status_var.set(f"Manually added database: {scout_db}")
    
    def on_db_selected(self, event):
        """Handle database selection"""
        selection = self.db_tree.selection()
        if not selection:
            return
        
        db_name = self.db_tree.item(selection[0], "values")[0]
        self.selected_db = db_name
        self.status_var.set(f"Selected database: {db_name}")
    
    def select_directory(self):
        """Open a directory selection dialog"""
        directory = filedialog.askdirectory(title="Select Export Directory")
        if directory:
            self.target_directory = directory
            self.dir_var.set(directory)
            self.status_var.set(f"Selected export directory: {directory}")
    
    def export_collections(self):
        """Export collections to JSON files"""
        if not self.selected_container:
            messagebox.showwarning("Warning", "Please select a Docker container first")
            return
        
        if not self.selected_db:
            messagebox.showwarning("Warning", "Please select a database first")
            return
        
        if not self.target_directory:
            messagebox.showwarning("Warning", "Please select an export directory first")
            return
        
        # Start export in a separate thread
        threading.Thread(target=self._export_collections_thread, daemon=True).start()
    
    def _export_collections_thread(self):
        """Thread function for exporting collections"""
        try:
            self.status_var.set(f"Getting collections from {self.selected_db}...")
            self.progress_var.set(0)
            
            # Get collection names
            container = self.docker_client.containers.get(self.selected_container)
            
            # Try with mongosh first (newer MongoDB versions)
            cmd1 = "which mongosh"
            result1 = container.exec_run(cmd1)
            
            if result1.exit_code == 0:
                # Use mongosh
                cmd = f"mongosh --quiet --eval 'db.getSiblingDB(\"{self.selected_db}\").getCollectionNames().forEach(function(c){{print(c)}})'"
            else:
                # Try with mongo (older MongoDB versions)
                cmd = f"mongo --quiet --eval 'db.getSiblingDB(\"{self.selected_db}\").getCollectionNames().forEach(function(c){{print(c)}})'"
            
            result = container.exec_run(cmd)
            
            if result.exit_code != 0:
                # If both mongo/mongosh commands failed, try a direct approach with mongoexport
                self.status_var.set("Getting collections list failed, trying to export anyway...")
                
                # Try to get a list of collections by listing files in the database directory
                # This is a fallback and may not work in all MongoDB configurations
                collections = ["Try direct export"]
            else:
                collections = result.output.decode('utf-8').strip().split('\n')
            
            if not collections or collections[0] == '':
                self.status_var.set("No collections found in the database. Trying direct export...")
                collections = ["Try direct export"]
            
            total_collections = len(collections)
            self.status_var.set(f"Found {total_collections} collections. Exporting...")
            
            # Create target directory if it doesn't exist
            export_dir = Path(self.target_directory)
            export_dir.mkdir(parents=True, exist_ok=True)
            
            # If we have a special "Try direct export" placeholder, try a different approach
            if collections == ["Try direct export"]:
                # Try using mongoexport to get a list of collections
                cmd_alt = f"mongoexport --db {self.selected_db} --collection system.namespaces 2>/dev/null || echo 'Error: Could not get collections'"
                result_alt = container.exec_run(cmd_alt)
                
                if "Error: Could not get collections" in result_alt.output.decode('utf-8'):
                    # Ask user for a collection name to try exporting
                    collection = simpledialog.askstring("Collection Name", "Enter a collection name to export:")
                    if collection:
                        collections = [collection]
                    else:
                        raise Exception("No collection name provided for export.")
            
            # Export each collection
            for i, collection in enumerate(collections):
                if not collection:  # Skip empty collection names
                    continue
                    
                self.status_var.set(f"Exporting collection {i+1}/{total_collections}: {collection}")
                self.progress_var.set((i / total_collections) * 100)
                
                # Export to temp location in container
                temp_path = f"/tmp/{collection}.json"
                export_cmd = f"mongoexport --db {self.selected_db} --collection {collection} --out {temp_path}"
                export_result = container.exec_run(export_cmd)
                
                if export_result.exit_code != 0:
                    self.status_var.set(f"Warning: Failed to export {collection}: {export_result.output.decode('utf-8')}")
                    continue
                
                # Copy from container to host
                try:
                    bits, stat = container.get_archive(temp_path)
                    
                    # Save the tar content to a file
                    tar_path = export_dir / f"{collection}.tar"
                    with open(tar_path, 'wb') as f:
                        for chunk in bits:
                            f.write(chunk)
                    
                    # Extract the JSON from the tar
                    with tarfile.open(tar_path) as tar:
                        for member in tar.getmembers():
                            basename = os.path.basename(member.name)
                            if basename.endswith('.json'):
                                f = tar.extractfile(member)
                                if f:
                                    with open(export_dir / basename, 'wb') as outfile:
                                        outfile.write(f.read())
                    
                    # Remove the tar file
                    tar_path.unlink()
                    
                    # Remove temp file from container
                    container.exec_run(f"rm {temp_path}")
                except Exception as e:
                    self.status_var.set(f"Error copying {collection}: {str(e)}")
                    continue
            
            self.progress_var.set(100)
            self.status_var.set(f"Export completed! Collections exported to {self.target_directory}")
            messagebox.showinfo("Success", f"Export completed!\nCollections exported to {self.target_directory}")
            
        except Exception as e:
            self.status_var.set(f"Error during export: {str(e)}")
            messagebox.showerror("Error", f"Export failed: {str(e)}")

if __name__ == "__main__":
    app = MongoDockerExporter()
    app.mainloop()